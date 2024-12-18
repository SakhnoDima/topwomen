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
        timeout: 500000,
      }
    );

    const jobElements = await page.$$("li.ps_grid-row.psc_rowact");
    let { id, idOld } = await jobElements[0].$eval(
      'span[id*="HRS_APP_JBSCH_I_HRS_JOB_OPENING_ID"]',
      (el) => el.textContent.trim()
    );
    await jobElements[0].click();

    let counter = 1;
    let retry = 0;

    while (true) {
      console.log(`Processing job #${counter}...`);
      while (!id || id === idOld) {
        const idElement = await page.$(
          'span[id="HRS_SCH_WRK2_HRS_JOB_OPENING_ID"]'
        );
        if (idElement) {
          id = await idElement.evaluate((el) => el.textContent.trim());
          if (retry > 5) {
            let nextPageBtn = await page.$(
              'a[id="DERIVED_HRS_FLU_HRS_NEXT_PB"]',
              {
                timeout: 5000,
              }
            );
            await nextPageBtn.click();
            console.log("Click next page Btn after 5 retry");
          }
        } else {
          console.warn("ID element not found, retrying...");
        }
        retry++;
        await delayer(300);
      }
      retry = 0;
      console.log("Start search");

      // search title
      let title;
      try {
        const titleElement = await page.waitForSelector(
          'h1[id="PT_PAGETITLE"]',
          { timeout: 2000 }
        );
        if (!titleElement) {
          console.error("Title element not found, skipping job...");
          idOld = id;
          counter++;
          continue;
        }
        title = await titleElement.evaluate((el) => el.textContent.trim());
      } catch {
        console.warn("Title element not found, skipping job...");
        idOld = id;
        counter++;
        continue;
      }

      console.log(`Job title: ${title}`);

      // search locanion
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
        idOld = id;
        counter++;
        continue;
      }

      // search sector
      const sector = await getSector(title);

      // search link
      const shareBtn = await page.$('a[id*="HRS_SCH_WRK_HRS_CE_EML_FRND"]');
      if (shareBtn) {
        console.log("Share button found, clicking...");
        await shareBtn.click();
      } else {
        console.error("Share button not found, skipping...");
        idOld = id;
        counter++;
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
        break;
      }

      const iframe = await iframeElement.contentFrame();
      if (!iframe) {
        console.error("Iframe content not accessible!");
        break;
      }

      console.log("Extracting job link from iframe...");
      await delayer(5000);

      const shareCloseBtn = await iframe.$(
        'a[id="HRS_APPL_WRK_HRS_CANCEL_BTN"]'
      );

      const shareMessageElement = await iframe.$(
        'span[id="HRS_EMLFRND_WRK_HRS_CRSP_MSG"]',
        { timeout: 10000 }
      );
      if (!shareMessageElement && shareCloseBtn) {
        console.log(`shareMessageElement not found`);
        idOld = id;
        counter++;
        await shareCloseBtn.click();
        await delayer(5000);
      } else if (!shareMessageElement && !shareCloseBtn) {
        break;
      }

      const shareMessage = await iframe.$eval(
        'span[id="HRS_EMLFRND_WRK_HRS_CRSP_MSG"]',
        (el) => el.textContent.trim()
      );
      if (!shareMessage && shareCloseBtn) {
        console.error("Text in Iframe doesnt found");
        idOld = id;
        counter++;
        await shareCloseBtn.click();
        await delayer(1000);
      } else if (!shareMessage && !shareCloseBtn) {
        break;
      }

      const link = shareMessage
        .match(/https?:\/\/[^\s]+/g)[0]
        .trim()
        .replace(/Thank$/, "");
      await delayer(500);

      if (shareCloseBtn) {
        console.log("Closing iframe...");
        await shareCloseBtn.click();
        await delayer(1000);
      } else {
        console.warn("Close button in iframe not found.");
      }

      let nextPageBtn = await page.$('a[id="DERIVED_HRS_FLU_HRS_NEXT_PB"]', {
        timeout: 5000,
      });
      if (!nextPageBtn) {
        break;
      }

      const isDisabled = await nextPageBtn.evaluate(
        (el) => el.getAttribute("disabled") === "disabled"
      );

      vacancies.push({ title, sector, location, url: link });

      if (isDisabled) {
        console.log("Next page button is disabled, ending process...");
        break;
      }

      console.log("Going to next job...");
      await nextPageBtn.click();
      idOld = id;
      counter++;
      await delayer(2000);
    }
  } catch (error) {
    await trackMixpanel("EuInvestBank International", 0, false, error.message);
    console.error("European-Investment-Bank crawler error:", error);
  } finally {
    if (vacancies.length > 0)
      await dataSaver("European Investment Bank", vacancies);
    await browser.close();
  }
}
