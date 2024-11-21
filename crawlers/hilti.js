import * as cheerio from "cheerio";
import { getSector } from "../assistants/sector-switcher.js";
import axios from "axios";
import { trackMixpanel } from "../mixpanel.js";
import { dataSaver } from "../controllers/dataControllers.js";

export async function fetchingDataFromHilti() {
  try {
    console.log("Hilt crawler started");

    let page = 1;
    const vacancies = [];

    while (true) {
      const response = await fetchAllJobResponses(page);

      let $ = cheerio.load(response);

      let vacancyPromises = $(".grid.job-listing .card-job")
        .map(async (_, element) => {
          const vacancyTitle = $(element)
            .find(".stretched-link.js-view-job")
            .text()
            .trim();

          const vacancyLink = $(element)
            .find(".stretched-link.js-view-job")
            .attr("href");

          const jobCountry = $(element)
            .find(".list-inline-item")
            .first()
            .text()
            .split(",")
            .map((part) => part.trim())
            .pop();

          const vacancySector = await getSector(vacancyTitle);

          if (vacancyTitle && vacancyLink && vacancySector) {
            return {
              title: vacancyTitle,
              url: `https://careers.hilti.group/${vacancyLink}`,
              sector: vacancySector,
              location: jobCountry,
            };
          }
        })
        .get();

      const vacancyResults = await Promise.all(vacancyPromises);

      vacancies.push(...vacancyResults);
      page += 1;

      if (vacancyResults.length < 20) {
        break;
      }
    }

    dataSaver("Hilti", vacancies);
  } catch (error) {
    console.error("Hilti crawler error:", error);
    trackMixpanel("Hilti", 0, false, error.message);
  }
}

async function fetchAllJobResponses(page) {
  const baseUrl = "https://careers.hilti.group/en/jobs";
  const queryParams = `?page=${page}#results`;
  const url = `${baseUrl}/${queryParams}`;

  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Cache-Control": "no-cache",
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(`Request error: ${error.message}`);
  }
}
