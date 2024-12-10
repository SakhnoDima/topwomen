import axios from "axios";
import * as cheerio from "cheerio";
import { getName } from "country-list";

import { trackMixpanel } from "../mixpanel.js";
import { getSector } from "../assistants/sector-switcher.js";
import { dataSaver } from "../controllers/dataControllers.js";
import { getEnglishCountryName } from "../helpers/index.js";
import { getValidCountryCodes } from "./biontech.js";

const VACANCIES_PER_PAGE = 25;

export async function fetchingDataFromPowerco() {
  try {
    console.log("PowerCo crawler started");
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

          const titleElement = $(element).find(".jobTitle.hidden-phone");

          if (titleElement.length) {
            vacancyData.title = titleElement.text().trim();
            const href = titleElement.find("a").attr("href");

            vacancyData.url = `https://careers.powerco.de${titleElement
              .find("a")
              .attr("href")}`;
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

    dataSaver("Powerco", vacancies);
  } catch (error) {
    trackMixpanel("Powerco", 0, false, error.message);
    console.error("Powerco crawler error:", error);
  }
}

async function karcherDataFetcher(offset) {
  const response = await axios.get(
    `https://careers.powerco.de/search/?q=&sortColumn=referencedate&sortDirection=desc&startrow=${offset}`
  );
  return response.data;
}
