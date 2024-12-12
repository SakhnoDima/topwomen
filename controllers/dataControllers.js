import axios from "axios";
import { trackMixpanel } from "../mixpanel.js";
import axiosRetry from "axios-retry";

axiosRetry(axios, {
  retries: 3, // Кількість спроб
  retryDelay: (retryCount) => {
    console.log(`Retry attempt: ${retryCount}`);
    return retryCount * 1000; // Затримка між спробами (1 секунда, 2 секунди, 3 секунди тощо)
  },
  retryCondition: (error) => {
    // Повторювати тільки для помилок мережі або серверних помилок (5xx)
    return axiosRetry.isNetworkOrIdempotentRequestError(error);
  },
});

export const dataSaver = async (companyName, vacancies) => {
  const responseBody = {
    company: companyName,
    vacancies,
  };

  try {
    const response = await axios.post(
      "https://topwomen.careers/wp-json/custom/v1/add-company-vacancies",
      JSON.stringify(responseBody),
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`${companyName} vacancies saved!`);
    console.log(`Total vacancies in ${companyName}`, vacancies.length);
    trackMixpanel(companyName, vacancies.length, true);
  } catch (error) {
    console.error("Error saving data:", error.message);
    throw new Error(error.message);
  }
};
