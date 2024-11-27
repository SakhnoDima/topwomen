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
    headless: false,
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

    // const clickUntilHidden = async () => {
    //   let isVisible = true;
    //   let click = 0;
    //   while (isVisible) {
    //     try {
    //       isVisible = await page.$eval(".ps_box-more", (el) => el !== null);
    //       if (isVisible) {
    //         await page.click(".ps_box-more");
    //         click++;
    //         await delayer(1000);
    //       }
    //     } catch (error) {
    //       isVisible = false;
    //     }
    //   }
    // };
    // await clickUntilHidden();

    const jobElements = await page.$$("li.ps_grid-row.psc_rowact");
    let { id, idOld } = await jobElements[0].$eval(
      'span[id*="HRS_APP_JBSCH_I_HRS_JOB_OPENING_ID"]',
      (el) => el.textContent.trim()
    );
    await jobElements[0].click();

    let counter = 1;

    while (true) {
      while (idOld === id) {
        const idElement = await page.$(
          'span[id="HRS_SCH_WRK2_HRS_JOB_OPENING_ID"]'
        );
        if (idElement) {
          id = await idElement.evaluate((el) => el.textContent.trim());
        }
        await delayer(200);
      }

      const title = await page.$eval('h1[id="PT_PAGETITLE"]', (el) =>
        el.textContent.trim()
      );
      const locationText = await page.$eval(
        'span[id*="HRS_SCH_WRK_HRS_DESCRLONG"]',
        (el) => el.textContent.trim()
      );
      const countryCode = locationText
        .split(" - ")
        .map((part) => part.trim())
        .shift();
      const location = await getName(countryCode);
      const sector = await getSector(title);

      const shareBtn = await page.$('a[id*="HRS_SCH_WRK_HRS_CE_EML_FRND"]');
      await shareBtn.click();

      const modalFrame = await page.waitForSelector(
        'iframe[title="Careers Popup window"]'
      );
      if (modalFrame) {
        console.log("!!  modal frame !!");

        const iframeElement = await page.$(
          'iframe[title="Careers Popup window"]'
        );
        await delayer(1000);
        console.log(1);
        const iframe = await iframeElement.contentFrame();
        console.log(2);
        const shareMessage = await iframe.$eval(
          'span[id="HRS_EMLFRND_WRK_HRS_CRSP_MSG"]',
          (el) => el.textContent.trim()
        );
        console.log(shareMessage);
        let link = shareMessage
          .match(/https?:\/\/[^\s]+/g)[0]
          .trim()
          .replace(/Thank$/, "");
        console.log("\n\n", link);

        const shareCloseBtn = await iframe.$(
          'a[id="HRS_APPL_WRK_HRS_CANCEL_BTN"]',
          { timeout: 2000 }
        );
        if (shareCloseBtn) {
          await shareCloseBtn.click();
          await delayer(1500);
        } else console.log("Dont found");

        vacancies.push({
          title,
          sector,
          location,
          link,
        });

        const nextPageBtn = await page.$(
          'a[id="DERIVED_HRS_FLU_HRS_NEXT_PB"]',
          { timeout: 2000 }
        );
        if (!nextPageBtn) {
          console.log("nextPageBtn not found");
        }

        if (
          (await nextPageBtn.evaluate((el) => el.getAttribute("disabled"))) ===
          "disabled"
        ) {
          break;
        }
        await nextPageBtn.click();
        idOld = id;
        counter++;
      } else {
        console.log("Framr didnt found");

        const nextPageBtn = await page.$('a[id="DERIVED_HRS_FLU_HRS_NEXT_PB"]');
        if (
          (await nextPageBtn.evaluate((el) => el.getAttribute("disabled"))) ===
          "disabled"
        ) {
          break;
        }
        await nextPageBtn.click();
        idOld = id;
      }
    }

    // for (const element of jobElements) {
    //   const title = await element.$eval('span[id*="SCH_JOB_TITLE"]', (el) =>
    //     el.textContent.trim()
    //   );
    //
    //   const locationText = await element.$eval('span[id*="LOCATION"]', (el) =>
    //     el.textContent.trim()
    //   );
    //   const countryCode = locationText
    //     .split(" - ")
    //     .map((part) => part.trim())
    //     .shift();
    //   const location = await getName(countryCode);
    //
    //   const sector = await getSector(title);
    //
    //   const id = await element.$eval(
    //     'span[id*="HRS_APP_JBSCH_I_HRS_JOB_OPENING_ID"]',
    //     (el) => el.textContent.trim()
    //   );
    //   const link = `https://erecruitment.eib.org/psp/hr/EIBJOBS/CAREERS/c/HRS_HRAM_FL.HRS_CG_SEARCH_FL.GBL?Page=HRS_APP_JBPST_FL&Action=U&FOCUS=Applicant&SiteId=1&JobOpeningId=${id}&PostingSeq=2`;
    //
    //   vacancies.push({
    //     title,
    //     sector,
    //     location,
    //     url: link,
    //   });
    // }

    // await dataSaver("European Investment Bank", vacancies);
  } catch (error) {
    // await trackMixpanel("EuInvestBank International", 0, false, error.message);
    console.error("European-Investment-Bank crawler error:", error);
  } finally {
    await browser.close();
    console.log(vacancies);
  }
}

fetchingDataEuInvBank();
