import puppeteer from "puppeteer-extra";
import { delayer } from "../assistants/helpers.js";
import { getSector } from "../assistants/sector-switcher.js";
import {getName} from "country-list";
import {trackMixpanel} from "../mixpanel.js";
import axios from "axios";


export async function fetchingDataEuInvBank() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto(
    "https://erecruitment.eib.org/psc/hr/EIBJOBS/CAREERS/c/HRS_HRAM_FL.HRS_CG_SEARCH_FL.GBL?Page=HRS_APP_SCHJOB_FL&Action=U",
    {
      waitUntil: "networkidle2",
    }
  );

  try {

    const clickUntilHidden = async () => {
      let isVisible = true;
      let click = 0;
      while (isVisible) {
        try {
          isVisible = await page.$eval(".ps_box-more", (el) => el !== null);
          if (isVisible) {
            await page.click(".ps_box-more");
            click++;
            await delayer(1000);
          }
        } catch (error) {
          isVisible = false;
        }
      }
    };
    await clickUntilHidden();

    const vacancies = [];

    const jobElements = await page.$$("li.ps_grid-row.psc_rowact");
    console.log(`Found ${jobElements.length} job elements.`);

    for (const element of jobElements) {
      const title = await element.$eval(
          'span[id*="SCH_JOB_TITLE"]',
          el => el.textContent.trim()
      );

      const locationText = await element.$eval(
          'span[id*="LOCATION"]',
          el => el.textContent.trim()
      );
      const countryCode = locationText.split(" - ").map(part => part.trim()).shift();
      const location = await getName(countryCode);

      const sector = await getSector(title);

      const id = await element.$eval(
          'span[id*="HRS_APP_JBSCH_I_HRS_JOB_OPENING_ID"]',
          el => el.textContent.trim()
      );
      const link = `https://erecruitment.eib.org/psp/hr/EIBJOBS/CAREERS/c/HRS_HRAM_FL.HRS_CG_SEARCH_FL.GBL?Page=HRS_APP_JBPST_FL&Action=U&FOCUS=Applicant&SiteId=1&JobOpeningId=${id}&PostingSeq=2`;

      vacancies.push({
        title,
        sector,
        location,
        link
      });
    }

    const responseBody = {
      company: "EuInvestBank",
      vacancies: vacancies,
    };

    // axios.post(
    //     "https://topwomen.careers/wp-json/custom/v1/add-company-vacancies",
    //     JSON.stringify(responseBody),
    //     {
    //       headers: {
    //         "Content-Type": "application/json",
    //       },
    //     }
    // )
    //     .then((response) => {
    //       console.log("EuInvestBank vacancies saved!");
    //       trackMixpanel("EuInvestBank International", vacancies.length, true);
    //     })
    //     .catch((error) => {
    //       console.log("Error", error.message);
    //       throw Error(error.message);
    //     });

    console.log(responseBody);
    console.log("Total vacancies in EuInvestBank", vacancies.length);
  } catch (error) {
    // trackMixpanel("EuInvestBank International", 0, false, error.message);
    console.error("EuInvestBank crawler error:", error);
  } finally {

    await browser.close();
  }
}
fetchingDataEuInvBank();
