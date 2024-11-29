import axios from "axios";

import { trackMixpanel } from "../mixpanel.js";
import { getSector } from "../assistants/sector-switcher.js";
import { dataSaver } from "../controllers/dataControllers.js";


async function fetchingDataFromSiemens() {
  console.log("Женя топ девелопер");
  console.log("Діма тоже нічо так))");

  let offset = 0;
  let totalVacancies = 5000;
  const vacancies = [];

  try {
    while (offset < totalVacancies) {
      console.log(offset, totalVacancies);

      const offsets = Array.from({length: 5}, (_, i) => offset + i * 10);
      const dataBatch = await fetchBatch(offsets);

      for (const data of dataBatch) {
        totalVacancies = data.count;

        for (const position of data.positions) {
          const title = position.name;
          const location = position.location.match(/, ([^,]+)$/)[1].trim();
          const url = position.canonicalPositionUrl;

          vacancies.push({
            title,
            sector: await getSector(title),
            location,
            url,
          });
        }
      }
      //
      // if (offset !== 0 && offset % 2800 === 0) {
      //   await delay(180000);
      // }
      offset += 50;
    }

    await dataSaver("Siemens", vacancies);
  } catch (error) {
    await trackMixpanel("Siemens", 0, false, error.message);
    console.error("Siemens crawler error:", error);
  } finally {
    console.log(vacancies, vacancies.length);
  }
}

async function fetchBatch(offsets, retries = 5, delayMs = 90000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const promises = offsets.map(offset =>
          axios.get(
              `https://jobs.siemens.com/api/apply/v2/jobs?domain=siemens.com&start=${offset}&num=10&hl=en`
          )
      );

      const responses = await Promise.all(promises);
      return responses.map(response => response.data); // Успішно завершено
    } catch (error) {
      if (
          error.response &&
          (error.response.status === 429 || error.response.status === 403)
      ) {
        console.warn(
            `Received ${error.response.status}. Attempt ${attempt} of ${retries}. Waiting for ${delayMs}ms...`
        );
        await delay(delayMs);
      } else {
        throw error;
      }
    }
  }

  throw new Error(`Failed to fetch batch after ${retries} attempts.`);
}


function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

fetchingDataFromSiemens()
