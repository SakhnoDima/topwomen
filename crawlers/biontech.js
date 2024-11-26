import * as cheerio from "cheerio";
import { getSector } from "../assistants/sector-switcher.js";
import { trackMixpanel } from "../mixpanel.js";
import { getName } from "country-list";
import { dataSaver } from "../controllers/dataControllers.js";
import { getEnglishCountryName } from "../helpers/index.js";

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
        const country = getName(countryCode);

        if (!getEnglishCountryName(country)) {
          console.log("Skipped invalid country");
          return null;
        }

        const vacancyData = {
          title: vacancyTitle,
          sector: vacancySector,
          location: getEnglishCountryName(country),
          url: `https://jobs.biontech.com${vacancyLink}`,
        };

        vacancies.push(vacancyData);
      });

      offset += BATCH_SIZE;

      if ($(".data-row").length < offset) {
        break;
      }
    }

    dataSaver("Biontech", vacancies);
  } catch (error) {
    console.error("Biontech crawler error:", error);
    trackMixpanel("Biontech", 0, false, error.message);
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
