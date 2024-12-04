import { countryMapping } from "../constants/countries.js";

export const getEnglishCountryName = (country) => {
  if (!countryMapping[country]) {
    console.log(`New country ${country}`);
    return country;
  }

  return countryMapping[country];
};
