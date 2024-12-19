import axios from "axios";
import * as cheerio from "cheerio";
import { trackMixpanel } from "../mixpanel.js";

import { getSector } from "../assistants/sector-switcher.js";
import { dataSaver } from "../controllers/dataControllers.js";
import { getEnglishCountryName } from "../helpers/index.js";

const VACANCIES_PER_PAGE = 100;

export async function fetchingDataFromBeiersdorf() {
  console.log("Beiersdorf crawler started");
  const vacancies = [];
  try {
    let page = 1;

    while (true) {
      const responseHtml = await fetchAllJobResponses(VACANCIES_PER_PAGE, page);
      const $ = cheerio.load(responseHtml);

      const promises = $(".cw-job")
        .map(async (_, element) => {
          let vacancyData = {
            title: "",
            sector: "",
            location: "",
            url: "",
          };

          // title
          const titleElement = $(element).find(".cw-job-title");
          vacancyData.title = titleElement.text().trim();

          // sector
          vacancyData.sector = await getSector(titleElement.text().trim());

          // location
          const spans = $(element)
            .find("span")
            .filter((_, el) => $(el).text().trim());

          const locationElement = spans.eq(4);
          const locationText = locationElement.text().trim();
          const country = locationText.split(",").pop().trim();
          vacancyData.location = getEnglishCountryName(country);

          // link
          const href = $(element).find("a").attr("href");
          vacancyData.url = href;

          return vacancyData;
        })
        .get();

      const processedVacancies = await Promise.all(promises);

      vacancies.push(...processedVacancies.filter(Boolean));

      if ($(".cw-job").length < 100) break;
      page += 1;
    }
  } catch (error) {
    console.error("Beiersdorf crawler error:", error);
    trackMixpanel("Beiersdorf", 0, false, error.message);
  } finally {
    if (vacancies.length > 0) {
      dataSaver("Beiersdorf", vacancies);
    }
  }
}

async function fetchAllJobResponses(count, page) {
  try {
    const response = await axios.get(
      `https://www.beiersdorf.com/ajax/Jobboard/JobResultAjax?db=web&contextItemId={213FB95D-4545-426C-9F6A-7CD5753A00EA}&lang=en&count=${count}&sort=date&page=${page}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          "Cache-Control": "no-cache",
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw new Error(error.message);
  }
}
