import * as cheerio from "cheerio";
import { getSector } from "../assistants/sector-switcher.js";
import { trackMixpanel } from "../mixpanel.js";
import axios from "axios";
import { response } from "express";
import { error } from "console";
import { delayer } from "../assistants/helpers.js";

export async function fetchingDataFromVinci() {
  try {
    console.log("Vinci crawler started");

    let page = 1;
    const offset = 200;
    const vacancies = [];

    while (true) {
      const response = await fetchAllJobResponses(page, offset);
      const $ = cheerio.load(response);

      const vacancyPromises = $(".search-results--list > li")
        .map(async (_, element) => {
          try {
            const vacancyTitle = $(element)
              .find(".search-results--link-jobtitle")
              .text()
              .trim();

            const vacancyLink = $(element)
              .find(".search-results--link")
              .attr("href");

            const regionOrCountry = $(element)
              .find(".job-location")
              .text()
              .trim();

            if (!vacancyTitle || !vacancyLink || !regionOrCountry) {
              console.log("Skipped invalid vacancy");
              return null;
            }

            const vacancySector = await getSector(vacancyTitle);

            return {
              title: vacancyTitle,
              url: `https://jobs.vinci.com${vacancyLink}`,
              sector: vacancySector,
              location: regionOrCountry,
            };
          } catch (err) {
            console.error("Error processing vacancy:", err.message);
            return null;
          }
        })
        .get();

      const results = (await Promise.all(vacancyPromises)).filter(Boolean);
      vacancies.push(...results);

      console.log(`Page ${page} processed, vacancies found: ${results.length}`);
      page++;
      delayer(1000);

      if (results.length < offset) {
        console.log("Stop crawling - fewer vacancies than offset.");
        break;
      }
    }

    let responseBody = {
      company: "Vinci",
      vacancies: vacancies,
    };

    console.log("Total vacancies in Vinci", vacancies.length);
    axios
      .post(
        "https://topwomen.careers/wp-json/custom/v1/add-company-vacancies",
        JSON.stringify(responseBody),
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      .then((response) => {
        console.log("Vinci vacancies saved!");
        trackMixpanel("Vinci", vacancies.length, true);
      })
      .catch((error) => {
        console.log("Error", error.message);
        throw Error(error.message);
      });
  } catch (error) {
    console.error("Vinci crawler error:", error);
    trackMixpanel("Vinci", 0, false, error.message);
  }
}

async function fetchAllJobResponses(page, offset) {
  const baseUrl = "https://jobs.vinci.com/en/search-jobs/results";
  const queryParams = `?ActiveFacetID=0&CurrentPage=${page}&RecordsPerPage=${offset}&Distance=50&RadiusUnitType=0&Keywords=&Location=&ShowRadius=False&IsPagination=False&CustomFacetName=&FacetTerm=&FacetType=0&SearchResultsModuleName=Search+Results&SearchFiltersModuleName=Search+Filters&SortCriteria=0&SortDirection=0&SearchType=6&PostalCode=&ResultsType=0&fc=&fl=&fcf=&afc=&afl=&afcf=`;
  const url = `${baseUrl}${queryParams}`;

  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Cache-Control": "no-cache",
      },
    });

    return response.data.results;
  } catch (error) {
    throw new Error(`Request error: ${error.message}`);
  }
}
