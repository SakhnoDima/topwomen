import puppeteer from "puppeteer-extra";
import { trackMixpanel } from "../mixpanel.js";
import { getSector } from "../assistants/sector-switcher.js";
import { delayer } from "../assistants/helpers.js";
import axios from "axios";

export async function fetchingDataFromMondelez() {
  console.log("Mondelez crawler started");

  // Init browser
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

  // Init page
  const [page] = await browser.pages();
  await page.setViewport({
    width: 1440,
    height: 760,
    deviceScaleFactor: 1,
  });

  let pageCounter = 1;
  const vacancies = [];
  try {
    await page.goto(
      `https://www.mondelezinternational.com/careers/jobs?term=&page=${pageCounter}`
    );

    // Wait loading elements
    await delayer(500);
    await page.waitForSelector("li.pagination-item.event_button_click");
    await delayer(500);

    let pageCounterMax = 0;
    const elements = await page.$$("li.pagination-item.event_button_click");
    for (const element of elements) {
      const ariaLabel = await element.evaluate((el) =>
        el.getAttribute("aria-label")
      );
      const numericValue = parseInt(ariaLabel, 10);
      if (numericValue > pageCounterMax) {
        pageCounterMax = numericValue;
      }
    }

    console.log(pageCounterMax);

    while (pageCounter < pageCounterMax) {
      const allVacancies = await page.$$(".resultRenderContainer div");

      for (let i = 0; i < allVacancies.length; i++) {
        const element = allVacancies[i];

        const vacancyTitle = await element.$eval("a", (el) =>
          el.textContent.trim()
        );
        const vacancyId = await element.$$eval("p", (elements) =>
          elements
            .map((p) => p.textContent.trim())
            .find((text) => /R-\d{6}/.test(text))
        );
        const jobLocation = await element.$$eval("p a", (links) =>
          Array.from(links)
            .map((link) => link.textContent.trim())
            .pop()
        );

        if (vacancyTitle && vacancyId && jobLocation) {
          const vacancySector = await getSector(vacancyTitle);
          const jobCountry = await extractCountry(jobLocation);
          const vacancyLink = `https://hourlyjobs-us.mondelezinternational.com/job-reference/${await extractId(
            vacancyId
          )}`;

          if (vacancySector && jobCountry && vacancyLink) {
            vacancies.push({
              vacancyTitle,
              vacancySector,
              vacancyLink,
              jobCountry,
            });
          }
        }
      }

      pageCounter++;

      await page.goto(
        `https://www.mondelezinternational.com/careers/jobs?term=&page=${pageCounter}`
      );

      await delayer(500);
      await page.waitForSelector("div.resultRenderContainer");
      await delayer(500);
    }

    const responseBody = {
      company: "Mondelez",
      vacancies: vacancies,
    };

    console.log("Total vacancies in Mondelez", vacancies.length);
    // await axios.post(
    //     "https://topwomen.careers/wp-json/custom/v1/add-company-vacancies",
    //     JSON.stringify(responseBody),
    //     {
    //         headers: {
    //             "Content-Type": "application/json",
    //         },
    //     }
    // );

    // trackMixpanel("Mondelez", vacancies.length, true);
    console.log("Mondelez crawler completed");
  } catch (error) {
    // trackMixpanel("Mondelez", 0, false, error.message);
    console.error("Mondelez crawler error:", error);
  } finally {
    console.log(vacancies, vacancies.length);
    await browser.close();
  }
}

const extractCountry = (text) => {
  const regex = /(?:,\s*[^,]+)?\s*,\s*([A-Za-z\s]+)$/;
  const match = text.match(regex);
  return match ? match[1].trim() : null;
};

const extractId = (text) => {
  const regex = /R-\d{6}/;
  const match = text.match(regex);
  return match ? match[0].trim() : null;
};
