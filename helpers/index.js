import { countryMapping } from "../constants/countries.js";

export const getEnglishCountryName = (country) => {
  return countryMapping[country] || "Unknown";
};
