import puppeteer from "puppeteer-extra";
import * as cheerio from "cheerio";
import { delayer } from "../assistants/helpers.js";
import { getSector } from "../assistants/sector-switcher.js";

const BASE_URL =
  "https://erecruitment.eib.org/psc/hr/EIBJOBS/CAREERS/c/HRS_HRAM_FL.HRS_CG_SEARCH_FL.GBL?Page=HRS_APP_SCHJOB_FL&Action=U";

export async function fetchingDataEuInvBank() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto(
    "https://erecruitment.eib.org/psc/hr/EIBJOBS/CAREERS/c/HRS_HRAM_FL.HRS_CG_SEARCH_FL.GBL?Page=HRS_APP_SCHJOB_FL&Action=U",
    {
      waitUntil: "networkidle2",
    }
  );

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

  const content = await page.content();
  const $ = cheerio.load(content);

  const jobs = [];

  const jobElements = $("li.ps_grid-row.psc_rowact");
  console.log(`Found ${jobElements.length} job elements.`);

  jobElements.each((_, element) => {
    const jobTitle = $(element)
      .find(".ps_box-label:contains('Job Title')")
      .next()
      .text()
      .trim();

    const location = $(element)
      .find(".ps_box-label:contains('Location')")
      .next()
      .text()
      .trim()
      .split(" - ")
      .map((part) => part.trim())
      .pop();

    jobs.push({
      title: jobTitle,
      location,
    });
  });

  console.log(jobs);

  console.log('All "more" buttons clicked or hidden.');
  await delayer(10000);
  await browser.close();
}
fetchingDataEuInvBank();
