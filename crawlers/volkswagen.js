import axios from "axios";
import * as cheerio from "cheerio";
import { getName } from "country-list";

import { trackMixpanel } from "../mixpanel.js";
import { getSector } from "../assistants/sector-switcher.js";
import { dataSaver } from "../controllers/dataControllers.js";
import { getEnglishCountryName } from "../helpers/index.js";
import { getValidCountryCodes } from "./biontech.js";

const VACANCIES_PER_PAGE = 25;

export async function fetchingDataFromVolkswagenGroup() {
  try {
    console.log("Volkswagen crawler started");
    let offset = 0;
    const vacancies = [];

    while (true) {
      const responseHtml = await volkswagenGroupDataFetcher(offset);
      const $ = cheerio.load(responseHtml);

      const promises = $(".data-row")
        .map(async (_, element) => {
          let vacancyData = {
            title: "",
            sector: "",
            location: "",
            url: "",
          };

          const titleElement = $(element).find(".jobTitle.hidden-phone");

          if (titleElement.length) {
            vacancyData.title = titleElement.text().trim();

            vacancyData.url = `https://jobs.volkswagen-group.com${titleElement
              .find("a")
              .attr("href")}`;
            vacancyData.sector = await getSector(titleElement.text().trim());
          } else return null;

          const vacancyLocation = $(element)
            .find(".jobLocation")
            .first()
            .text()
            .trim();

          if (vacancyLocation.length > 2) {
            const [countryCode] = getValidCountryCodes(vacancyLocation);

            const countryNameFromLibrary = getName(countryCode);
            vacancyData.location = getEnglishCountryName(
              countryNameFromLibrary
            );
          } else if (vacancyLocation.length <= 2) {
            const countryNameFromLibrary = getName(vacancyLocation);
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

    dataSaver("Volkswagen", vacancies);
  } catch (error) {
    trackMixpanel("Volkswagen", 0, false, error.message);
    console.error("Volkswagen crawler error:", error);
  }
}

async function volkswagenGroupDataFetcher(offset) {
  const response = await axios.get(
    `https://jobs.volkswagen-group.com/Volkswagen/search/?&startrow=${offset}`
  );

  return response.data;
}
