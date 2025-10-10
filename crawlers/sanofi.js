import axios from "axios";
import * as cheerio from "cheerio";

import { trackMixpanel } from "../mixpanel.js";
import { getSector } from "../assistants/sector-switcher.js";
import { dataSaver } from "../controllers/dataControllers.js";

const RESULTS_PER_PAGE = 100;

export const fetchingDataFromSanofi = async () => {
    console.log("Sanofi crawler start!");
    const vacancies = [];
    let page = 1;

    try {
        while (true) {
            const response = await sanofiDataFetcher(page);

            if (!response?.hasJobs) break;

            const $ = cheerio.load(response?.results);

            const promises = $("#search-results-list ul li")
                .map(async (_, el) => {
                    //title
                    const title = $(el).find("h2").text().trim();
                    //sector
                    const sector = await getSector(title);
                    //url
                    const relativeLink = $(el).find("a").attr("href");
                    const url = relativeLink
                        ? `https://jobs.sanofi.com${relativeLink}`
                        : null;
                    //location
                    const sanofiLocation = $(el)
                        .find(".job-location")
                        .text()
                        .replace("Location:", "")
                        .trim();
                    if (sanofiLocation === "Multiple locations") {
                        return { title, url, location: sanofiLocation, sector };
                    } else {
                        const locationsArr = sanofiLocation
                            .split(",")
                            .map((e) => e.trim());

                        return {
                            title,
                            url,
                            location: locationsArr[1],
                            sector,
                        };
                    }
                })
                .get();

            const pageVacancies = await Promise.all(promises);
            vacancies.push(...pageVacancies.filter(Boolean));

            const totalPages = Number(
                $("#search-results").attr("data-total-pages")
            );
            // console.log(
            //     `Page ${page}/${totalPages} parsed (${vacancies.length} total)`
            // );

            if (page >= totalPages) break;
            page++;
        }
        dataSaver("Sanofi", vacancies);
    } catch (error) {
        trackMixpanel("Sanofi", 0, false, error.message);
        console.error("Sanofi crawler error:", error);
    }
};

const sanofiDataFetcher = async (page) => {
    const response = await axios.get(
        `https://jobs.sanofi.com/en/search-jobs/results?ActiveFacetID=0&CurrentPage=${page}&RecordsPerPage=${RESULTS_PER_PAGE}&TotalContentResults=&Distance=50&RadiusUnitType=0&Keywords=&Location=&ShowRadius=False&IsPagination=False&CustomFacetName=&FacetTerm=&FacetType=0&SearchResultsModuleName=Search+Results&SearchFiltersModuleName=Search+Filters&SortCriteria=0&SortDirection=0&SearchType=5&PostalCode=&ResultsType=0&fc=&fl=&fcf=&afc=&afl=&afcf=&TotalContentPages=NaN`
    );
    return response.data;
};
