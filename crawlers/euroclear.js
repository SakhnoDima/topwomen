import axios from "axios";
import { trackMixpanel } from "../mixpanel.js";
import { getSector } from "../assistants/sector-switcher.js";
import { dataSaver } from "../controllers/dataControllers.js";
import { getEnglishCountryName } from "../helpers/index.js";
const BATCH_SIZE = 100;

export async function fetchingDataFromEuroclear() {
  try {
    console.log("Euroclear crawler started");

    let offset = 0;
    const vacancies = [];

    while (true) {
      const response = await axios.get(
        `https://don.fa.em2.oraclecloud.com/hcmRestApi/resources/latest/recruitingCEJobRequisitions?onlyData=true&expand=requisitionList.secondaryLocations,flexFieldsFacet.values,requisitionList.requisitionFlexFields&finder=findReqs;siteNumber=CX_1003,facetsList=LOCATIONS%3BWORK_LOCATIONS%3BWORKPLACE_TYPES%3BTITLES%3BCATEGORIES%3BORGANIZATIONS%3BPOSTING_DATES%3BFLEX_FIELDS,limit=${BATCH_SIZE},sortBy=POSTING_DATES_DESC,offset=${offset}`
      );
      const data = response.data;

      if (data.items[0].requisitionList.length === 0) break;

      vacancies.push(
        ...(await Promise.all(
          data.items[0].requisitionList.map(
            async ({ Title, PrimaryLocation, Id }) => ({
              title: Title,
              sector: await getSector(Title),
              location: getEnglishCountryName(PrimaryLocation),
              url: `https://don.fa.em2.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1003/job/${Id}`,
            })
          )
        ))
      );

      offset += BATCH_SIZE;
    }

    dataSaver("Euroclear", vacancies);
  } catch (error) {
    trackMixpanel("Euroclear", 0, false, error.message);
    console.error("Euroclear crawler error:", error);
  }
}
