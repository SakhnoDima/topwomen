import axios from "axios";
import * as cheerio from "cheerio";
import { getName } from "country-list";

import { trackMixpanel } from "../mixpanel.js";
import { getSector } from "../assistants/sector-switcher.js";
import { dataSaver } from "../controllers/dataControllers.js";
import { getEnglishCountryName } from "../helpers/index.js";
import { getValidCountryCodes } from "./biontech.js";

const VACANCIES_PER_PAGE = 50;

export async function fetchingDataFromKarcher() {
  try {
    console.log("Karcher crawler started");
    let offset = 0;
    const vacancies = [];

    while (true) {
      const responseHtml = await karcherDataFetcher(offset);
      const $ = cheerio.load(responseHtml);

      const promises = $(".data-row")
        .map(async (_, element) => {
          let vacancyData = {
            title: "",
            sector: "",
            location: "",
            url: "",
          };

          const titleElement = $(element).find(".hidden-phone .jobTitle-link");

          if (titleElement.length) {
            vacancyData.title = titleElement.text().trim();
            vacancyData.url = `https://careers.kaercher.com${titleElement.attr(
              "href"
            )}`;
            vacancyData.sector = await getSector(titleElement.text().trim());
          } else return null;

          const vacancyLocation = $(element)
            .find(".jobLocation")
            .first()
            .text()
            .trim();

          if (vacancyLocation) {
            const [countryCode] = getValidCountryCodes(vacancyLocation);

            const countryNameFromLibrary = getName(countryCode);
            vacancyData.location = getEnglishCountryName(
              countryNameFromLibrary
            );
          } else return null;

          return vacancyData;
        })
        .get();

      const processedVacancies = await Promise.all(promises);

      vacancies.push(...processedVacancies.filter(Boolean));

      if ($(".data-row").length < VACANCIES_PER_PAGE) break;
      offset += VACANCIES_PER_PAGE;
    }

    dataSaver("Karcher", vacancies);
  } catch (error) {
    trackMixpanel("Karcher", 0, false, error.message);
    console.error("Karcher crawler error:", error);
  }
}

async function karcherDataFetcher(offset) {
  const response = await axios.get(
    `https://careers.kaercher.com/search/?startrow=${offset}`
  );
  return response.data;
}
