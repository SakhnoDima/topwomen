import * as cheerio from "cheerio";
import { getSector } from "../assistants/sector-switcher.js";
import axios from "axios";
import { trackMixpanel } from "../mixpanel.js";
import { dataSaver } from "../controllers/dataControllers.js";
import { getEnglishCountryName } from "../helpers/index.js";

export async function fetchingDataFromGrundfos() {
  try {
    console.log("Grundfos crawler started");

    let page = 0;
    const vacancies = [];

    while (true) {
      const unFilteredVacancies = await fetchAllJobResponses(page);

      for (const vacancy of unFilteredVacancies) {
        const title = vacancy.unifiedStandardTitle.trim();
        const location = vacancy.jobLocationShort[0].split(",").pop().trim();
        const url = `https://jobs.grundfos.com/job/${vacancy.unifiedUrlTitle}/${vacancy.id}-en_GB`;

        vacancies.push({
          title,
          sector: await getSector(title),
          location: getEnglishCountryName(location),
          url,
        });
      }

      if (unFilteredVacancies.length === 50) {
        break;
      }
      page += 5;
    }

    dataSaver("Grundfos", vacancies);
  } catch (error) {
    console.error("Grundfos crawler error:", error);
    //trackMixpanel("Grundfos", 0, false, error.message);
  }
}

async function fetchAllJobResponses(page) {
  const parallelRequests = 5;
  const baseUrl = "https://jobs.grundfos.com/services/recruiting/v1/jobs";

  for (let attempt = 1; attempt <= parallelRequests; attempt++) {
    try {
      const promises = Array.from({ length: parallelRequests }, (_, i) => {
        return axios
          .post(
            baseUrl,
            {
              locale: "en_GB",
              pageNumber: page + i,
              sortBy: "",
              keywords: "",
              location: "",
              facetFilters: {},
              brand: "",
              skills: [],
              categoryId: 0,
              alertId: "",
              rcmCandidateId: "",
            },
            {
              headers: {
                "User-Agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Cache-Control": "no-cache",
                "Content-Type": "application/json",
              },
            }
          )
          .then((response) => response.data.jobSearchResult);
      });

      const responses = await Promise.all(promises);
      return responses
        .flat()
        .filter((elem) => elem !== undefined)
        .map((elem) => elem.response);
    } catch (error) {
      if (error.code === "ECONNRESET" || error.code === "ETIMEDOUT") {
        console.warn(
          `Received ${error.response.status}. Attempt ${attempt}. Waiting for 90000ms...`
        );
        await delayer(90000);
      } else {
        throw error;
      }
    }
  }

  throw new Error("Failed to fetch batch after 5 attempts.");
}

fetchingDataFromGrundfos();
