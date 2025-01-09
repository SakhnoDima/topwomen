import axios from "axios";
import * as cheerio from "cheerio";
import { trackMixpanel } from "../mixpanel.js";

import { getSector } from "../assistants/sector-switcher.js";
import { dataSaver } from "../controllers/dataControllers.js";

export async function fetchingDataFromEuCentralBank() {
  try {
    console.log("European Central Bank crawler started");

    const vacancies = [];
    let offset = 0;

    while (true) {
      const responseHtml = await dataFetcher(offset);
      const $ = cheerio.load(responseHtml);

      const promises = $("article.article--result")
        .map(async (_, element) => {
          let vacancyData = {
            title: "",
            sector: "",
            location: "",
            url: "",
          };

          //title
          const titleElement = $(element).find(
            ".article__header__text__title a"
          );
          vacancyData.title = titleElement.text().trim();

          //url
          vacancyData.url = $(element)
            .find(".article__header__text__title a")
            .attr("href");

          //sector
          vacancyData.sector = await getSector(titleElement.text().trim());

          //location
          vacancyData.location = "Germany";

          const hasEmptyValues = Object.values(vacancyData).some(
            (value) => !value || value.trim() === ""
          );
          if (hasEmptyValues) {
            return null; // Skip this object
          }

          return vacancyData;
        })
        .get();

      const processedVacancies = await Promise.all(promises);

      vacancies.push(...processedVacancies.filter(Boolean));

      if (processedVacancies.length < 10) {
        break;
      }
      offset += 10;
    }

    dataSaver("European Central Bank", vacancies);
  } catch (error) {
    trackMixpanel("European Central Bank", 0, false, error.message);
    console.error("European Central Bank crawler error:", error);
  }
}

async function dataFetcher(offset) {
  const response = await axios.get(
    `https://talent.ecb.europa.eu/careers/SearchJobs/?jobRecordsPerPage=10&jobOffset=${offset}`
  );

  return response.data;
}
