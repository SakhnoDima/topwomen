<<<<<<< HEAD
import * as cheerio from "cheerio";
import { getSector } from "../assistants/sector-switcher.js";
import { trackMixpanel } from "../mixpanel.js";
import axios from "axios";

export async function fetchingDataFromMondelez() {
  try {
    console.log("Mondelez crawler started");

    let page = 1;
    const offset = 200;
    const vacancies = [];
    const response = await fetchAllJobResponses(page, offset);
    // while (true) {
    //   const response = await fetchAllJobResponses(page, offset);
    //   const $ = cheerio.load(response);

    //   const vacancyPromises = $(".search-results--list > li")
    //     .map(async (_, element) => {
    //       try {
    //         const vacancyTitle = $(element)
    //           .find(".search-results--link-jobtitle")
    //           .text()
    //           .trim();

    //         const vacancyLink = $(element)
    //           .find(".search-results--link")
    //           .attr("href");

    //         const regionOrCountry = $(element)
    //           .find(".job-location")
    //           .text()
    //           .trim();

    //         if (!vacancyTitle || !vacancyLink || !regionOrCountry) {
    //           console.log("Skipped invalid vacancy");
    //           return null;
    //         }

    //         const vacancySector = await getSector(vacancyTitle);

    //         return {
    //           title: vacancyTitle,
    //           url: `https://jobs.vinci.com${vacancyLink}`,
    //           sector: vacancySector,
    //           location: regionOrCountry,
    //         };
    //       } catch (err) {
    //         console.error("Error processing vacancy:", err.message);
    //         return null;
    //       }
    //     })
    //     .get();

    //   const results = (await Promise.all(vacancyPromises)).filter(Boolean);
    //   vacancies.push(...results);

    //   console.log(`Page ${page} processed, vacancies found: ${results.length}`);
    //   page++;

    //   if (results.length < offset) {
    //     console.log("Stop crawling - fewer vacancies than offset.");
    //     break;
    //   }
    // }

    // let responseBody = {
    //   company: "Mondelez",
    //   vacancies: vacancies,
    // };

    // await axios.post(
    //   "https://topwomen.careers/wp-json/custom/v1/add-company-vacancies",
    //   JSON.stringify(responseBody),
    //   {
    //     headers: {
    //       "Content-Type": "application/json",
    //     },
    //   }
    // );

    console.log("Total vacancies in Vinci", vacancies.length);
    //trackMixpanel("Mondelez", vacancies.length, true);
  } catch (error) {
    console.error("Mondelez crawler error:", error);
    //trackMixpanel("Mondelez", 0, false, error.message);
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

// export async function fetchingDataFromMondelez() {
//   console.log("Mondelez crawler started");

//   // Init browser
//   const browser = await puppeteer.launch({
//     headless: false,
//     args: [
//       "--no-sandbox",
//       "--disable-setuid-sandbox",
//       "--disable-dev-shm-usage",
//       "--disable-gpu",
//       "--window-size=1440,760",
//     ],
//   });

//   // Init page
//   const [page] = await browser.pages();
//   await page.setViewport({
//     width: 1440,
//     height: 760,
//     deviceScaleFactor: 1,
//   });

//   let pageCounter = 1;
//   const vacancies = [];
//   try {
//     await page.goto(
//       `https://www.mondelezinternational.com/careers/jobs?term=&page=${pageCounter}`
//     );

//     // Wait loading elements
//     await delayer(500);
//     await page.waitForSelector("li.pagination-item.event_button_click");
//     await delayer(500);

//     let pageCounterMax = 0;
//     const elements = await page.$$("li.pagination-item.event_button_click");
//     for (const element of elements) {
//       const ariaLabel = await element.evaluate((el) =>
//         el.getAttribute("aria-label")
//       );
//       const numericValue = parseInt(ariaLabel, 10);
//       if (numericValue > pageCounterMax) {
//         pageCounterMax = numericValue;
//       }
//     }

//     console.log(pageCounterMax);

//     while (pageCounter < pageCounterMax) {
//       const allVacancies = await page.$$(".resultRenderContainer div");

//       for (let i = 0; i < allVacancies.length; i++) {
//         const element = allVacancies[i];

//         const vacancyTitle = await element.$eval("a", (el) =>
//           el.textContent.trim()
//         );
//         const vacancyId = await element.$$eval("p", (elements) =>
//           elements
//             .map((p) => p.textContent.trim())
//             .find((text) => /R-\d{6}/.test(text))
//         );
//         const jobLocation = await element.$$eval("p a", (links) =>
//           Array.from(links)
//             .map((link) => link.textContent.trim())
//             .pop()
//         );

//         if (vacancyTitle && vacancyId && jobLocation) {
//           const vacancySector = await getSector(vacancyTitle);
//           const jobCountry = await extractCountry(jobLocation);
//           const vacancyLink = `https://hourlyjobs-us.mondelezinternational.com/job-reference/${await extractId(
//             vacancyId
//           )}`;

//           if (vacancySector && jobCountry && vacancyLink) {
//             vacancies.push({
//               vacancyTitle,
//               vacancySector,
//               vacancyLink,
//               jobCountry,
//             });
//           }
//         }
//       }

//       pageCounter++;

//       await page.goto(
//         `https://www.mondelezinternational.com/careers/jobs?term=&page=${pageCounter}`
//       );

//       await delayer(500);
//       await page.waitForSelector("div.resultRenderContainer");
//       await delayer(500);
//     }

//     const responseBody = {
//       company: "Mondelez",
//       vacancies: vacancies,
//     };

//     console.log("Total vacancies in Mondelez", vacancies.length);
//     // await axios.post(
//     //     "https://topwomen.careers/wp-json/custom/v1/add-company-vacancies",
//     //     JSON.stringify(responseBody),
//     //     {
//     //         headers: {
//     //             "Content-Type": "application/json",
//     //         },
//     //     }
//     // );

//     // trackMixpanel("Mondelez", vacancies.length, true);
//     console.log("Mondelez crawler completed");
//   } catch (error) {
//     // trackMixpanel("Mondelez", 0, false, error.message);
//     console.error("Mondelez crawler error:", error);
//   } finally {
//     console.log(vacancies, vacancies.length);
//     await browser.close();
//   }
// }

// const extractCountry = (text) => {
//   const regex = /(?:,\s*[^,]+)?\s*,\s*([A-Za-z\s]+)$/;
//   const match = text.match(regex);
//   return match ? match[1].trim() : null;
// };

// const extractId = (text) => {
//   const regex = /R-\d{6}/;
//   const match = text.match(regex);
//   return match ? match[0].trim() : null;
// };
=======
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
>>>>>>> 4a0da3ac014081db9b83031a0d0c51297c4047ec
