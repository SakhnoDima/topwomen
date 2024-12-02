import axios from "axios";

import { trackMixpanel } from "../mixpanel.js";
import { getSector } from "../assistants/sector-switcher.js";
import { dataSaver } from "../controllers/dataControllers.js";
import { delayer } from "../assistants/helpers.js";
import { getEnglishCountryName } from "../helpers/index.js";

export async function fetchingDataFromSiemens() {
  const limit = 10;
  const parallelRequests = 5;
  let page = 0;
  let results = [];

  try {
    while (true) {
      const positions = await fetchBatch(page, parallelRequests, limit);
      for (const position of positions) {
        const title = position.name.trim();
        const location = position.location.split(",")[2].trim();
        const url = position.canonicalPositionUrl;

        results.push({
          title,
          sector: await getSector(title),
          location: getEnglishCountryName(location),
          url,
        });
      }

      if (positions.length === 0) {
        break;
      }
      page += parallelRequests;
      await delayer(1000);
    }
    await dataSaver("Siemens", results);
  } catch (error) {
    await trackMixpanel("Siemens", 0, false, error.message);
    console.error("Siemens crawler error:", error);
  } finally {
    console.log(results, results.length);
  }
}
async function fetchBatch(page, parallelRequests, limit) {
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const promises = Array.from({ length: parallelRequests }, (_, i) => {
        const offset = (page + i) * limit;
        return axios
          .get(
            `https://jobs.siemens.com/api/apply/v2/jobs?domain=siemens.com&start=${offset}`
          )
          .then((response) => response.data.positions);
      });

      const responses = await Promise.all(promises);
      return responses.flat();
    } catch (error) {
      if (
        error.response &&
        (error.response.status === 429 || error.response.status === 403)
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

ß;
