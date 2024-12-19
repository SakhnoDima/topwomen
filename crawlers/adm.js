import { getSector } from "../assistants/sector-switcher.js";
import axios from "axios";
import { trackMixpanel } from "../mixpanel.js";
import { dataSaver } from "../controllers/dataControllers.js";
import { getEnglishCountryName } from "../helpers/index.js";
import { delayer } from "../assistants/helpers.js";

export async function fetchingDataFromAdm() {
  const vacancies = [];

  try {
    console.log("ADM crawler started");

    let page = 1;

    while (true) {
      const unFilteredVacancies = await fetchAllJobResponses(page);

      for (const vacancy of unFilteredVacancies) {
        const title = vacancy.Questions[7].Value.trim();
        const location = vacancy.Questions[11].Value.trim();
        const url = vacancy.Link;

        vacancies.push({
          title,
          sector: await getSector(title),
          location: getEnglishCountryName(location),
          url,
        });
      }

      if (unFilteredVacancies.length < 250) {
        break;
      }
      page += 5;
      await delayer(1000);
    }
  } catch (error) {
    console.error("ADM crawler error:", error);
    trackMixpanel("ADM", 0, false, error.message);
  } finally {
    if (vacancies.length > 0) {
      dataSaver("ADM", vacancies);
    }
  }
}

async function fetchAllJobResponses(page) {
  const parallelRequests = 5;
  const baseUrl =
    "https://sjobs.brassring.com/TgNewUI/Search/Ajax/ProcessSortAndShowMoreJobs";

  for (let attempt = 1; attempt <= parallelRequests; attempt++) {
    try {
      const promises = Array.from({ length: parallelRequests }, (_, i) => {
        return axios
          .post(
            baseUrl,
            {
              partnerId: "25416",
              siteId: "5429",
              keyword: "",
              location: "",
              keywordCustomSolrFields:
                "JobTitle,Department,FORMTEXT8,FORMTEXT9,FORMTEXT10",
              locationCustomSolrFields: "",
              linkId: "4393911",
              Latitude: 0,
              Longitude: 0,
              facetfilterfields: {
                Facet: [],
              },
              powersearchoptions: {
                PowerSearchOption: [
                  {
                    VerityZone: "JobTitle",
                    Type: "text",
                    Value: null,
                  },
                  {
                    VerityZone: "FORMTEXT10",
                    Type: "single-select",
                    OptionCodes: [],
                  },
                  {
                    VerityZone: "FORMTEXT9",
                    Type: "single-select",
                    OptionCodes: [],
                  },
                  {
                    VerityZone: "FORMTEXT8",
                    Type: "single-select",
                    OptionCodes: [],
                  },
                  {
                    VerityZone: "Department",
                    Type: "select",
                    OptionCodes: [],
                  },
                  {
                    VerityZone: "AutoReq",
                    Type: "text",
                    Value: null,
                  },
                  {
                    VerityZone: "LastUpdated",
                    Type: "date",
                    Value: null,
                  },
                  {
                    VerityZone: "languagelist",
                    Type: "multi-select",
                    OptionCodes: [],
                  },
                ],
              },
              SortType: "LastUpdated",
              pageNumber: page + i,
              encryptedSessionValue:
                "^zWepMdUhTb4TG0t_slp_rhc_aTWjIzdn4iYwVTbYxcUOsI0faBJKCt8q3WDKAipVsNxynecaLAENL493dN2F0n0m2gGChTnhwNg76JkNkTWSKTsBJGM=",
            },
            {
              headers: {
                "User-Agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Cache-Control": "no-cache",
                "Content-Type": "application/json",
              },
            }
          )
          .then((response) => response.data.Jobs);
      });

      const responses = await Promise.all(promises);

      return responses.map((elem) => elem.Job).flat();
    } catch (error) {
      if (
        error.code === "ECONNRESET" ||
        error.code === "ETIMEDOUT" ||
        error.response?.status === 503
      ) {
        console.warn(
          `Received ${error.response.status}. Attempt ${attempt}. Waiting for 90000ms...`
        );
        await delayer(90000);
      } else {
        throw error;
      }
    }
  }

  throw new Error("Failed to fetch batch after 5 attempts.");
}
