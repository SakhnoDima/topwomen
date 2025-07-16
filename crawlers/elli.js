import axios from "axios";
import * as cheerio from "cheerio";
import { trackMixpanel } from "../mixpanel.js";

import { getSector } from "../assistants/sector-switcher.js";
import { dataSaver } from "../controllers/dataControllers.js";
import { getEnglishCountryName } from "../helpers/index.js";
import { delayer } from "../assistants/helpers.js";

export async function fetchingDataFromElli() {
    try {
        console.log("Elli crawler started");

        const vacancies = [];

        const responseHtml = await dataFetcher();
        const $ = cheerio.load(responseHtml);

        const promises = $(".jobs__item")
            .map(async (_, element) => {
                let vacancyData = {
                    title: "",
                    sector: "",
                    location: "",
                    url: "",
                };

                const titleElement = $(element).find(".jobs__content h5");
                vacancyData.title = titleElement.text().trim();
                vacancyData.url = $(element)
                    .find(".jobs__content a")
                    .attr("href");
                vacancyData.sector = await getSector(
                    titleElement.text().trim()
                );

                const cities = $(element)
                    .find(".jobs__office")
                    .text()
                    .split(",");
                let city = "";
                if (Array.isArray(cities) && cities.length > 0)
                    city = cities[0].trim();
                else return null;
                try {
                    const response = await axios.get(
                        `https://nominatim.openstreetmap.org/search?q=${city}&format=json`,
                        {
                            headers: {
                                "User-Agent":
                                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
                                Referer: `https://nominatim.openstreetmap.org/ui/search.html?q=${city}`,
                            },
                        }
                    );

                    if (response.data && response.data[0]["display_name"]) {
                        const locationList = response.data[0]["display_name"]
                            .split(",")
                            .map((el) => el.trim());

                        vacancyData.location = getEnglishCountryName(
                            locationList[locationList.length - 1]
                        );
                    } else {
                        console.warn(
                            `No location data found for city: ${city}`
                        );
                        return null;
                    }
                } catch (error) {
                    console.error(
                        `Error fetching location for ${city}:`,
                        error.message
                    );
                    return null;
                }

                await delayer(1000);
                return vacancyData;
            })
            .get();

        const processedVacancies = await Promise.all(promises);

        vacancies.push(...processedVacancies.filter(Boolean));

        dataSaver("Elli", vacancies);
    } catch (error) {
        trackMixpanel("Elli", 0, false, error.message);
        console.error("Elli crawler error:", error);
    }
}

async function dataFetcher() {
    const response = await axios.get(
        `https://www.elli.eco/en/about-elli/about-us/career/jobs`
    );
    return response.data;
}
