import axios from "axios";
import { trackMixpanel } from "../mixpanel.js";
import { getSector } from "../assistants/sector-switcher.js";
import * as cheerio from "cheerio";
import fs from 'node:fs';
import * as https from "node:https";

export async function fetchingDataFromMondelez() {
    try {
        console.log("Mondelez crawler started");

        let page = 1;
        const vacancies = [];

        while (true) {
            const response = await fetchAllJobResponses(page);

            fs.writeFile('index.html', response, err => {
                if (err) {
                    console.error(err);
                } else {
                    console.log("Write success")
                }
            });

            let $ = cheerio.load(response);

            let vacancyPromises = $(".resultRenderContainer")
                .map(async (_, element) => {
                    const vacancyTitle = $(element)
                        .find("a")
                        .first()
                        .text()
                        .trim();

                    // Вибираємо посилання на вакансію
                    const vacancyLink = $(element)
                        .find("a")
                        .first()
                        .attr("href");

                    // Вибираємо країну або локацію
                    const jobCountry = $(element)
                        .find("p a")
                        .last()
                        .text()
                        .split(",")
                        .map((part) => part.trim())
                        .pop();

                    const vacancySector = vacancyTitle ? await getSector(vacancyTitle) : null;

                    console.log({ vacancyTitle, vacancyLink, jobCountry, vacancySector });
                    if (vacancyTitle && vacancyLink && vacancySector && jobCountry) {
                        return {
                            title: vacancyTitle,
                            url: `https://careers.hilti.group/${vacancyLink}`,
                            sector: vacancySector,
                            location: jobCountry,
                        };
                    }

                    return null; // Якщо щось не знайшли
                })
                .get();

            const vacancyResults = await Promise.all(vacancyPromises);

            vacancies.push(...vacancyResults.filter((vacancy) => vacancy !== null));
            page++;
            break;
        }

        console.log(vacancies)

        // trackMixpanel("Mondelez", vacancies.length, true);
        console.log("Mondelez crawler completed");
    } catch (error) {
        // trackMixpanel("Mondelez", 0, false, error.message);
        console.error("Mondelez crawler error:", error);
    }
}

async function fetchAllJobResponses(page) {
    const baseUrl = "https://www.mondelezinternational.com/careers/jobs";
    const queryParams = `?term=&page=${page}`;
    const url = `${baseUrl}/${queryParams}`;

    const response = await axios.get(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 OPR/114.0.0.0",
            "Cache-Control": "no-cache",
            "Accept": "*/*",
            "Referer": "ttps://www.mondelezinternational.com/careers/jobs/?term=/",
            "Path": "/page-data/careers/jobs/page-data.json?term=/",
            "Accept-Encoding": "gzip, deflate, br, zstd",
            "Accept-Language": "uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7",
            "Content-Type": "application/vnd.oracle.adf.resourceitem+json;charset=utf-8",
            "Connection": "keep-alive",
            "Cookie": "sourceSiteURL=Company_Website; OptanonConsent=isGpcEnabled=0&datestamp=Sat+Nov+16+2024+16%3A19%3A38+GMT%2B0200+(%D0%B7%D0%B0+%D1%81%D1%85%D1%96%D0%B4%D0%BD%D0%BE%D1%94%D0%B2%D1%80%D0%BE%D0%BF%D0%B5%D0%B9%D1%81%D1%8C%D0%BA%D0%B8%D0%BC+%D1%81%D1%82%D0%B0%D0%BD%D0%B4%D0%B0%D1%80%D1%82%D0%BD%D0%B8%D0%BC+%D1%87%D0%B0%D1%81%D0%BE%D0%BC)&version=202405.2.0&browserGpcFlag=0&isIABGlobal=false&hosts=&consentId=5dd60ed2-f049-4c57-8fee-37fbd16a12f4&interactionCount=1&isAnonUser=1&landingPath=https%3A%2F%2Fwww.mondelezinternational.com%2Fcareers%2Fjobs%2F%3Fterm%3D%2F&groups=C0001%3A1%2CC0003%3A0%2CC0002%3A0%2CC0004%3A0",
        },
    });

    return response.data;
}

const extractCountry = (text) => {
    const regex = /(?:,\s*[^,]+)?\s*,\s*([A-Za-z\s]+)$/;
    const match = text.match(regex);
    return match ? match[1].trim() : null;
};


fetchingDataFromMondelez()