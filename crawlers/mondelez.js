import axios from "axios";
import countries from 'i18n-iso-countries';

import { trackMixpanel } from "../mixpanel.js";
import { getSector } from "../assistants/sector-switcher.js";


export async function fetchingDataFromMondelez() {
    console.log("Mondelez crawler started");

    let page = 0;
    const vacancies = [];
    try {
        while (true) {
            const response = await axios.post(
                `https://qdcqk4bj5r-dsn.algolia.net/1/indexes/Mondelezinternational_en_joblist_jobposting_start_date_desc/query`,
                {
                    "page": page,
                    "hitsPerPage": 20,
                },
                {
                    headers: {
                        'x-algolia-agent': 'Algolia for JavaScript (4.14.2); Browser',
                        'x-algolia-api-key': '16bdb752874a297d588b7ecf53cb2aa9',
                        'x-algolia-application-id': 'QDCQK4BJ5R',
                    },
                }
            );
            const data = response.data;

            if (data.hits.length === 0) break;

            for (let i = 0; i < data.hits.length; i++) {
                const title = data.hits[i].Job_Posting_Title[0] || null;
                const sector = await getSector(data.hits[i].Job_Posting_Title?.[0]) || null;
                const location = await convertLocation(data.hits[i].Job_Posting_Location_Data?.[0].Primary_Location_Reference?.[0]) || null;
                const url = `https://www.mondelezinternational.com/careers/jobs/job?jobid=${data.hits[i].Job_Requisition_ID?.[0]}` || null;

                if (title && location && url) {
                    vacancies.push({
                        title: title,
                        sector: sector,
                        location: location,
                        url: url,
                    });
                }
            }

            page++;
        }

        const responseBody = {
            company: "Mondelez International",
            vacancies: vacancies,
        };

        console.log("Total vacancies in Mondelez", vacancies.length);
        await axios.post(
            "https://topwomen.careers/wp-json/custom/v1/add-company-vacancies",
            JSON.stringify(responseBody),
            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        trackMixpanel("Mondelez International", vacancies.length, true);
        console.log("Mondelez crawler completed");
    } catch (error) {
        trackMixpanel("Mondelez International", 0, false, error.message);
        console.error("Mondelez crawler error:", error);
    }
}

const convertLocation = (code) => {
    if (!code) return null;
    const countryCode = code.slice(0, 2);
    const countryName = countries.getName(countryCode, "en");
    return countryName || null;
};

fetchingDataFromMondelez()