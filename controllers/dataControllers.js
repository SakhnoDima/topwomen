import axios from "axios";
import { trackMixpanel } from "../mixpanel.js";

export const dataSaver = async (companyName, vacancies) => {
  const responseBody = {
    company: companyName,
    vacancies,
  };
  axios
    .post(
      "https://topwomen.careers/wp-json/custom/v1/add-company-vacancies",
      JSON.stringify(responseBody),
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
    .then((response) => {
      console.log(`${companyName} vacancies saved!`);
      console.log(`Total vacancies in ${companyName}`, vacancies.length);
      trackMixpanel(companyName, vacancies.length, true);
    })
    .catch((error) => {
      console.log("Error", error.message);
      throw Error(error.message);
    });
};
