import { getSector } from "../assistants/sector-switcher.js";
import axios from "axios";
import { trackMixpanel } from "../mixpanel.js";
import { dataSaver } from "../controllers/dataControllers.js";
import { getEnglishCountryName } from "../helpers/index.js";
import { delayer } from "../assistants/helpers.js";
import { statesOfUs } from "../constants/usaStates.js";

const LIMIT = 20;
const OFFSET = 20;

export async function fetchingDataFromAdm() {
  const vacancies = [];
  let page = 0;

  try {
    console.log("Novanta crawler started");

    while (true) {
      const unFilteredVacancies = await fetchAllJobsNovanta(page);

      for (const vacancy of unFilteredVacancies) {
        const title = vacancy.title.trim();
        const url = `https://novanta.wd5.myworkdayjobs.com/en-US/Novanta-Careers${vacancy.externalPath}`;
        let location;
        const fullLocation = vacancy.externalPath.split("/");
        const locationCode = fullLocation[2].split("-");

        if (locationCode.length === 2) {
          statesOfUs.includes(locationCode[1])
            ? (location = "United States")
            : (location = getEnglishCountryName(locationCode[1]));
        } else if (locationCode.length === 3) {
          statesOfUs.includes(locationCode[2])
            ? (location = "United States")
            : (location = null);
        }
        if (location) {
          vacancies.push({
            title,
            sector: await getSector(title),
            location,
            url,
          });
        }
      }

      if (unFilteredVacancies.length < LIMIT) {
        break;
      }
      page += 5;
      await delayer(1000);
    }
  } catch (error) {
    console.error("Novanta crawler error:", error);
    trackMixpanel("Novanta", 0, false, error.message);
  } finally {
    if (vacancies.length > 0) {
      dataSaver("Novanta", vacancies);
    }
  }
}

async function fetchAllJobsNovanta(page) {
  const parallelRequests = 5;
  const results = [];

  const baseUrl =
    "https://novanta.wd5.myworkdayjobs.com/wday/cxs/novanta/Novanta-Careers/jobs";

  for (let attempt = 1; attempt <= parallelRequests; attempt++) {
    try {
      const promises = Array.from({ length: parallelRequests }, (_, i) => {
        const offset = (page + i) * OFFSET;
        return axios
          .post(
            baseUrl,
            {
              appliedFacets: {},
              limit: LIMIT,
              offset,
              searchText: "",
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
          .then((response) => ({
            data: response.data,
            offset,
          }));
      });

      const responses = (await Promise.all(promises)).sort(
        (a, b) => a.offset - b.offset
      );

      for (const response of responses) {
        response.data.jobPostings.map((elem) => results.push(elem));
        if (response.data.jobPostings.length < 20) {
          return results;
        }
      }

      return results;
    } catch (error) {
      if (
        error.code === "ECONNRESET" ||
        error.code === "ETIMEDOUT" ||
        error.response?.status === 503
      ) {
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
