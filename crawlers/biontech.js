import * as cheerio from "cheerio";
import { getSector } from "../assistants/sector-switcher.js";
import axios from "axios";
import { trackMixpanel } from "../mixpanel.js";
import { getName } from "country-list";
const BATCH_SIZE = 100;

function getValidCountryCodes(locationString) {
  const countryCodeMatches = locationString.match(
    /,\s*([A-Z]{2})\s*(?=,|\s|$)/g
  );
  const extractedCodes = countryCodeMatches.map(
    (code) => code.match(/[A-Z]{2}/)[0]
  );
  const validCodes = extractedCodes.filter(
    (code) => getName(code) !== undefined
  );

  return validCodes;
}

export async function fetchingDataFromBiontech() {
  try {
    console.log("Biontech crawler started");

    let offset = 0;
    const vacancies = [];

    while (true) {
      const response = await fetchAllJobResponses(offset);

      const html = await response.text();
      const $ = await cheerio.load(html);

      await $(".data-row").each(async (_, element) => {
        const vacancyTitle = $(element).find(".jobTitle-link").text().trim();
        const vacancyLink = $(element).find(".jobTitle-link").attr("href");
        const vacancyLocation = $(element)
          .find(".jobLocation")
          .first()
          .text()
          .trim();
        const vacancySector = await getSector(vacancyTitle);

        const [countryCode] = getValidCountryCodes(vacancyLocation);

        const vacancyData = {
          title: vacancyTitle,
          sector: vacancySector,
          location: getName(countryCode),
          url: `https://jobs.biontech.com${vacancyLink}`,
        };

        vacancies.push(vacancyData);
      });

      offset += BATCH_SIZE;

      if ($(".data-row").length < offset) {
        break;
      }
    }

    let responseBody = {
      company: "Biontech",
      vacancies: vacancies,
    };

    await axios.post(
      "https://topwomen.careers/wp-json/custom/v1/add-company-vacancies",
      JSON.stringify(responseBody),
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Total vacancies in Biontech", vacancies.length);
    trackMixpanel("Biontech", vacancies.length, true);

    console.log("Biontech crawler completed");
  } catch (error) {
    console.error("Biontech crawler error:", error);
    trackMixpanel("Biontech", 0, false, error.message);
    throw error;
  }
}

async function fetchAllJobResponses(offset = 0) {
  const baseUrl = "https://jobs.biontech.com/go/All-Jobs/8781301";
  const queryParams = "?q=&sortColumn=referencedate&sortDirection=desc";
  const url = `${baseUrl}/${offset}${queryParams}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Request error: ${response.status}`);
  }

  return response;
}
