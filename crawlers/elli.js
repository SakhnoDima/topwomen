import axios from "axios";
import * as cheerio from "cheerio";
import { trackMixpanel } from "../mixpanel.js";

import { getSector } from "../assistants/sector-switcher.js";
import { dataSaver } from "../controllers/dataControllers.js";
import { getEnglishCountryName } from "../helpers/index.js";

export async function fetchingDataFromElli() {
  try {
    console.log("Elli crawler started");

    const vacancies = [];

    const responseHtml = await dataFetcher();
    const $ = cheerio.load(responseHtml);

    const promises = $(".jobs__item")
      .map(async (_, element) => {
        let vacancyData = {
          title: "",
          sector: "",
          location: "",
          url: "",
        };

        const titleElement = $(element).find(".jobs__content h5");
        vacancyData.title = titleElement.text().trim();
        vacancyData.url = $(element).find(".jobs__content a").attr("href");
        vacancyData.sector = await getSector(titleElement.text().trim());

        const city = $(element).find(".jobs__office").text().split(" | ");

        const response = await axios.get(
          `https://nominatim.openstreetmap.org/search?q=${city[0]}&format=json`
        );
        const locationList = response.data[0]["display_name"]
          .split(",")
          .map((el) => el.trim());
        vacancyData.location = getEnglishCountryName(
          locationList[locationList.length - 1]
        );

        return vacancyData;
      })
      .get();

    const processedVacancies = await Promise.all(promises);

    vacancies.push(...processedVacancies.filter(Boolean));

    dataSaver("Elli", vacancies);
  } catch (error) {
    trackMixpanel("Elli", 0, false, error.message);
    console.error("Elli crawler error:", error);
  }
}

async function dataFetcher() {
  const response = await axios.get(
    `https://www.elli.eco/en/about-elli/about-us/career/jobs`
  );
  return response.data;
}
