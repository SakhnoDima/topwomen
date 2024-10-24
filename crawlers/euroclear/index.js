const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

const { delayer, scrollToElement } = require("./../../assistants/helpers")

require("dotenv").config();
puppeteer.use(StealthPlugin());

const startCrawler = async () => {
    try {
        console.log('Euroclear crawler started');

        // Init browser
        const browser = await puppeteer.launch({
            headless: false,
        });

        // Init page
        const [page] = await browser.pages();
        await page.setViewport({
            width: 1440,
            height: 760,
            deviceScaleFactor: 1,
        });

        await page.goto('https://don.fa.em2.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1003/requisitions');

        // Wait loading elements
        await delayer(500);
        await page.waitForSelector('div.job-grid-item__link');
        await delayer(500);

        // Start scrap data
        let responseBody = {
            "company": "Euroclear",
            "vacancies": []
        }

        let vacancyCards = await page.$$('div.job-grid-item__link');
        let totalCards = vacancyCards.length;

        for (let i = 0; i <= totalCards; i++) {
            // console.log(totalCards);

            let activeCard = vacancyCards[i];

            if (!activeCard) {
                console.log("Waiting card load...");
                vacancyCards = await waitForNewCards(page, totalCards);
                totalCards = vacancyCards.length;
                if (totalCards === i) {
                    break;
                }
                activeCard = vacancyCards[i];
            }

            const vacancyTitle = await page.evaluate(
                (el) => el.textContent,
                await activeCard.$('span.job-tile__title')
            );
            const vacancyLocation = await page.evaluate(
                (el) => el.textContent,
                await activeCard.$('span[data-bind="html: primaryLocation"]')
            );

            // console.log("Title:", vacancyTitle, "\nLocation:", vacancyLocation);

            const vacancyData = {
                "title": vacancyTitle,
                "location": vacancyLocation
            }

            responseBody.vacancies.push(vacancyData);

            if (i % 3 === 0) {
                await scrollToElement(page, activeCard);
            }
        }

        console.log("Euroclear crawler completed");

        return responseBody;

    } catch (error) {
        console.error('Euroclear crawler error:', error);
        throw error;
    }
}

const waitForNewCards = async (page, beforeCards) => {
    try {
        let vacancyCards;
        let afterCards, cycleCount = 0;

        while (cycleCount < 10) {
            vacancyCards = await page.$$('div.job-grid-item__link');
            afterCards = vacancyCards.length;

            if (beforeCards === afterCards) {
                await delayer(1000);
                cycleCount++;
            } else if (cycleCount >= 10) {
                console.log('New cards not founded');
            } else {
                break;
            }
        }

        await delayer(2000);
        return vacancyCards;
    } catch (error) {
        console.error("Wait new cards error:", error.message);
        throw error;
    }
}

// startCrawler();

module.exports = {
    startCrawler
}