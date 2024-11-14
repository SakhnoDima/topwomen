import { fetchingDataFromBiontech } from "./biontech.js";
import { fetchingDataFromEuroclear } from "./euroclear.js";
import { fetchingDataFromHilti } from "./hilti.js";

export const CRAWLERS = {
  euroclear: fetchingDataFromEuroclear,
  biontech: fetchingDataFromBiontech,
  hilti: fetchingDataFromHilti,
};
