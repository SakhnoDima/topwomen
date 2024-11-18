import { fetchingDataFromBiontech } from "./biontech.js";
import { fetchingDataFromEuroclear } from "./euroclear.js";
import { fetchingDataFromHilti } from "./hilti.js";
import { fetchingDataFromMondelez } from "./mondelez.js";
import { fetchingDataFromVinci } from "./vinci.js";

export const CRAWLERS = {
  euroclear: fetchingDataFromEuroclear,
  biontech: fetchingDataFromBiontech,
  hilti: fetchingDataFromHilti,
  mondelez: fetchingDataFromMondelez,
  vinci: fetchingDataFromVinci,
};
