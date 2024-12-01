import axios from "axios";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import dotenv from "dotenv";

import { delayer } from "../assistants/helpers.js";
import { getSector } from "../assistants/sector-switcher.js";
import { getName } from "country-list";
import { trackMixpanel } from "../mixpanel.js";
import { dataSaver } from "../controllers/dataControllers.js";

puppeteer.use(StealthPlugin());
dotenv.config();

export async function fetchingDataEuInvBank() {
  console.log("European-Investment-Bank crawler started");
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--window-size=1440,760",
    ],
  });

  const [page] = await browser.pages();
  await page.setViewport({
    width: 1440,
    height: 760,
    deviceScaleFactor: 1,
  });

  const vacancies = [];

  try {
    await page.goto(
      "https://erecruitment.eib.org/psc/hr/EIBJOBS/CAREERS/c/HRS_HRAM_FL.HRS_CG_SEARCH_FL.GBL?Page=HRS_APP_SCHJOB_FL&Action=U",
      {
        waitUntil: "networkidle2",
      }
    );

    const jobElements = await page.$$("li.ps_grid-row.psc_rowact");
    let { id, idOld } = await jobElements[0].$eval(
      'span[id*="HRS_APP_JBSCH_I_HRS_JOB_OPENING_ID"]',
      (el) => el.textContent.trim()
    );
    await jobElements[0].click();

    let counter = 1;

    while (true) {
      console.log(`Processing job #${counter}...`);
      let id;
      while (!id || id === idOld) {
        const idElement = await page.$(
          'span[id="HRS_SCH_WRK2_HRS_JOB_OPENING_ID"]'
        );
        if (idElement) {
          id = await idElement.evaluate((el) => el.textContent.trim());
        } else {
          console.warn("ID element not found, retrying...");
        }
        await delayer(300);
      }

      // !search title
      let title;
      try {
        const titleElement = await page.waitForSelector(
          'h1[id="PT_PAGETITLE"]',
          { timeout: 2000 }
        );
        title = await titleElement.evaluate((el) => el.textContent.trim());

        if (!title) {
          console.error("Title element not found, skipping job...");
          continue;
        }
      } catch {
        console.warn("Title element not found, skipping job...");
        continue;
      }

      console.log(`Job title: ${title}`);

      // !search locanion
      let location;
      try {
        const locationText = await page.$eval(
          'span[id*="HRS_SCH_WRK_HRS_DESCRLONG"]',
          (el) => el.textContent.trim()
        );
        const countryCode = locationText
          .split(" - ")
          .map((part) => part.trim())
          .shift();
        location = await getName(countryCode);
      } catch {
        console.warn("Location element not found, skipping job...");
        continue;
      }

      // !search sector
      const sector = await getSector(title);

      // search link
      const shareBtn = await page.$('a[id*="HRS_SCH_WRK_HRS_CE_EML_FRND"]');
      if (shareBtn) {
        console.log("Share button found, clicking...");
        await shareBtn.click();
      } else {
        console.error("Share button not found, skipping...");
        continue;
      }

      console.log("Waiting for iframe...");
      let iframeElement;
      try {
        iframeElement = await page.waitForSelector(
          'iframe[title="Careers Popup window"]',
          { timeout: 5000 }
        );
      } catch (e) {
        console.error("Iframe not found, skipping job...");
        continue;
      }

      const iframe = await iframeElement.contentFrame();
      if (!iframe) {
        console.error("Iframe content not accessible!");
        continue;
      }

      console.log("Extracting job link from iframe...");

      const shareMessageElement = await iframe.$(
        'span[id="HRS_EMLFRND_WRK_HRS_CRSP_MSG"]',
        { timeout: 5000 }
      );
      if (!shareMessageElement) {
        console.log(`shareMessageElement not found`);
        continue;
      }
      const shareMessage = await iframe.$eval(
        'span[id="HRS_EMLFRND_WRK_HRS_CRSP_MSG"]',
        (el) => el.textContent.trim()
      );
      if (!shareMessage) {
        console.error("Text in Iframe doesnt found");
        continue;
      }

      const link = shareMessage
        .match(/https?:\/\/[^\s]+/g)[0]
        .trim()
        .replace(/Thank$/, "");
      console.log(`Job link: ${link}`);

      const shareCloseBtn = await iframe.$(
        'a[id="HRS_APPL_WRK_HRS_CANCEL_BTN"]'
      );
      if (shareCloseBtn) {
        console.log("Closing iframe...");
        await shareCloseBtn.click();
        await delayer(500);
      } else {
        console.warn("Close button in iframe not found.");
      }

      vacancies.push({ title, sector, location, url: link });

      const nextPageBtn = await page.$('a[id="DERIVED_HRS_FLU_HRS_NEXT_PB"]', {
        timeout: 5000,
      });
      if (!nextPageBtn) {
        console.error("Next page button not found, ending process...");
        continue;
      }

      const isDisabled = await nextPageBtn.evaluate(
        (el) => el.getAttribute("disabled") === "disabled"
      );
      if (isDisabled) {
        console.log("Next page button is disabled, ending process...");
        break;
      }

      console.log("Going to next job...");
      await nextPageBtn.click();
      idOld = id;
      counter++;
      await delayer(500);
    }
    await dataSaver("European Investment Bank", vacancies);
  } catch (error) {
    await trackMixpanel("EuInvestBank International", 0, false, error.message);
    console.error("European-Investment-Bank crawler error:", error);
  } finally {
    await browser.close();
    console.log(vacancies.length);
  }
}
