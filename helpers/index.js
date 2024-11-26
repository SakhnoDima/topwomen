import { countryMapping } from "../constants/countries.js";

export const getEnglishCountryName = (country) => {
  // if (!countryMapping[country]) {
  //   console.log(`${country}`);
  //   return "Unknown";
  // }

  return countryMapping[country] || false;
};
