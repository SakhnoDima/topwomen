import { fetchingDataFromBiontech } from "./biontech.js";
import { fetchingDataFromEuroclear } from "./euroclear.js";
import { fetchingDataFromHilti } from "./hilti.js";
import { fetchingDataFromMondelez } from "./mondelez.js";
import { fetchingDataFromVinci } from "./vinci.js";
import { fetchingDataEuInvBank } from "./euInvestBank.js";
import { fetchingDataFromSiemens } from "./siemens.js";
import { fetchingDataFromKarcher } from "./karcher.js";
import { fetchingDataFromGrundfos } from "./grundfos.js";
import { fetchingDataFromPowerco } from "./powerco.js";
import { fetchingDataFromVolkswagenGroup } from "./volkswagen.js";
import { fetchingDataFromAdm } from "./adm.js";
import { fetchingDataFromElli } from "./elli.js";
import { fetchingDataFromBeiersdorf } from "./beiersdorf.js";
import { fetchingDataFromEuCentralBank } from "./euCentralBank.js";
import { fetchingDataFromNovanta } from "./novanta.js";

export const CRAWLERS = {
    euroclear: fetchingDataFromEuroclear,
    biontech: fetchingDataFromBiontech,
    hilti: fetchingDataFromHilti,
    "mondelez international": fetchingDataFromMondelez,
    "vinci construction": fetchingDataFromVinci,
    "european investment bank": fetchingDataEuInvBank,
    siemens: fetchingDataFromSiemens,
    karcher: fetchingDataFromKarcher,
    grundfos: fetchingDataFromGrundfos,
    powerco: fetchingDataFromPowerco,
    volkswagen: fetchingDataFromVolkswagenGroup,
    adm: fetchingDataFromAdm,
    elli: fetchingDataFromElli,
    beiersdorf: fetchingDataFromBeiersdorf,
    "european central bank": fetchingDataFromEuCentralBank,

    novanta: fetchingDataFromNovanta,
};
