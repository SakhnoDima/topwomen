import { fetchingDataFromBiontech } from "./biontech.js";
import { fetchingDataFromEuroclear } from "./euroclear.js";
import { fetchingDataFromHilti } from "./hilti.js";
import { fetchingDataFromMondelez } from "./mondelez.js";
import { fetchingDataFromVinci } from "./vinci.js";
import { fetchingDataEuInvBank } from "./euInvestBank.js";
import { fetchingDataFromSiemens } from "./siemens.js";
import { fetchingDataFromKarcher } from "./karcher.js";
import { fetchingDataFromGrundfos } from "./grundfos.js";

export const CRAWLERS = {
  euroclear: fetchingDataFromEuroclear,
  biontech: fetchingDataFromBiontech,
  hilti: fetchingDataFromHilti,
  "mondelez international": fetchingDataFromMondelez,
  vinci: fetchingDataFromVinci,
  "european investment bank": fetchingDataEuInvBank,
  siemens: fetchingDataFromSiemens,
  karcher: fetchingDataFromKarcher,
  grundfos: fetchingDataFromGrundfos,
};
