import axios from "axios";
// import { trackMixpanel } from "../../mixpanel.js";

import {getSector} from "../assistants/sector-switcher.js";

export async function euroclearCrawler() {
    try {
        console.log("Euroclear crawler started");

        let limit = 100;
        let offset = 0;
        const vacancies = [];

        let totalVacancies = 0;

        while (true) {
            const response = await axios.get(
                `https://don.fa.em2.oraclecloud.com/hcmRestApi/resources/latest/recruitingCEJobRequisitions?onlyData=true&expand=requisitionList.secondaryLocations,flexFieldsFacet.values,requisitionList.requisitionFlexFields&finder=findReqs;siteNumber=CX_1003,facetsList=LOCATIONS%3BWORK_LOCATIONS%3BWORKPLACE_TYPES%3BTITLES%3BCATEGORIES%3BORGANIZATIONS%3BPOSTING_DATES%3BFLEX_FIELDS,limit=${limit},sortBy=POSTING_DATES_DESC,offset=${offset}`
            );
            const data = response.data;

            const vacancyList = data.items[0].requisitionList;

            if (!vacancyList || vacancyList.length === 0) {
                break;
            }

            for (const req of vacancyList) {
                const sector = await getSector(req.Title);

                const vacancyData = {
                    title: req.Title,
                    sector: sector,
                    location: req.PrimaryLocation,
                    url: `https://don.fa.em2.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1003/job/${req.Id}`,
                };

                vacancies.push(vacancyData);
                totalVacancies++;
            }

            offset += limit;

            if (vacancyList.length < offset) {
                break;
            }
        }

        let responseBody = {
            company: "Euroclear",
            vacancies: vacancies,
        };

        await axios.post(
            // "https://topwomen.careers/wp-json/custom/v1/add-company-vacancies",
            "http://localhost:3001",
            JSON.stringify(responseBody),
            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );


        // trackMixpanel("Euroclear", totalVacancies, true);

        // console.log("All vacancies:", responseBody, "\n\nTotal:", totalVacancies);
        console.log("Euroclear crawler completed");
    } catch (error) {
        console.error("Euroclear crawler error:", error);
        // trackMixpanel("Euroclear", 0, false, error.message);
        throw error;
    }
}

euroclearCrawler()