import puppeteer from "puppeteer-extra";
import dotenv from "dotenv";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import axios from "axios";

import { delayer, scrollToElement } from "./../../assistants/helpers.js";
import { getSector } from "./../../assistants/sector-switcher.js";
import { trackMixpanel } from "../../mixpanel.js";

dotenv.config();

export const startCrawler = async () => {
  try {
    console.log("Euroclear crawler started");
    const currentTime = new Date().toLocaleString("en-US", {
      timezone: "Europe/Brussels",
    });
    console.log(`Task started at ${currentTime} (Brussels time)`);
    // Init browser
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

    // Init page
    const [page] = await browser.pages();
    await page.setViewport({
      width: 1440,
      height: 760,
      deviceScaleFactor: 1,
    });

    await page.goto(
      "https://don.fa.em2.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1003/requisitions"
    );

    // Wait loading elements
    await delayer(500);
    await page.waitForSelector("div.job-grid-item__link");
    await delayer(500);

    // Start scrap data
    let responseBody = {
      company: "Euroclear",
      vacancies: [],
    };

    let vacancyCards = await page.$$("div.job-grid-item");
    let totalCards = vacancyCards.length;

    let counter1 = 0;
    let counter2 = 0;
    let counter3 = 0;
    let counter4 = 0;
    let counter5 = 0;
    let counter6 = 0;
    let counter7 = 0;
    let counter8 = 0;

    for (let i = 0; i <= totalCards; i++) {
      // console.log(totalCards);

      let activeCard = vacancyCards[i];

      if (!activeCard) {
        // console.log("Waiting card load...");
        vacancyCards = await waitForNewCards(page, totalCards);
        totalCards = vacancyCards.length;
        if (totalCards === i) {
          break;
        }
        activeCard = vacancyCards[i];
      }

      const vacancyTitle = await page.evaluate(
        (el) => el.textContent,
        await activeCard.$("span.job-tile__title")
      );
      const vacancySector = await getSector(vacancyTitle);

      const vacancyLocation = await page.evaluate(
        (el) => el.textContent,
        await activeCard.$('span[data-bind="html: primaryLocation"]')
      );

      const vacancyUrlElement = await activeCard.$("a.job-grid-item__link");
      const vacancyUrl = await vacancyUrlElement.evaluate((el) =>
        el.getAttribute("href")
      );

      if (vacancySector === "Other") {
        counter1++;
      } else if (vacancySector === "Finance & Banking") {
        counter2++;
      } else if (vacancySector === "Legal") {
        counter3++;
      } else if (vacancySector === "Sales") {
        counter4++;
      } else if (vacancySector === "IT") {
        counter5++;
      } else if (vacancySector === "Engineering") {
        counter6++;
      } else if (vacancySector === "Economics") {
        counter7++;
      } else if (vacancySector === "Business & Communications") {
        counter8++;
      }

      // console.log("Title:", vacancyTitle, "\nSection:", vacancySector);

      const vacancyData = {
        title: vacancyTitle,
        sector: vacancySector,
        location: vacancyLocation,
        url: vacancyUrl,
      };

      responseBody.vacancies.push(vacancyData);

      if (i % 3 === 0) {
        await scrollToElement(page, activeCard);
      }
    }

    await browser.close();

    console.log("Total vacancies:", totalCards);
    console.log("Finance & Banking:", counter2);
    console.log("Legal:", counter3);
    console.log("Sales:", counter4);
    console.log("IT:", counter5);
    console.log("Engineering:", counter6);
    console.log("Economics:", counter7);
    console.log("Business & Communications:", counter8);
    console.log("Other:", counter1);

    await axios.post(
      "https://topwomen.careers/wp-json/custom/v1/add-company-vacancies",
      JSON.stringify(responseBody),
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    trackMixpanel("Euroclear", totalCards, true);
    console.log("\nEuroclear crawler completed");

    return responseBody;
  } catch (error) {
    console.error("Euroclear crawler error:", error);
    trackMixpanel("Euroclear", 0, false, error.message);
    throw error;
  }
};

const waitForNewCards = async (page, beforeCards) => {
  try {
    let vacancyCards;
    let afterCards,
      cycleCount = 0;

    while (cycleCount < 10) {
      vacancyCards = await page.$$("div.job-grid-item");
      afterCards = vacancyCards.length;

      if (beforeCards === afterCards) {
        await delayer(1000);
        cycleCount++;
      } else if (cycleCount >= 10) {
        console.log("New cards not founded");
      } else {
        break;
      }
    }

    await delayer(2000);
    return vacancyCards;
  } catch (error) {
    console.error("Wait new cards error:", error.message);
    throw error;
  }
};
