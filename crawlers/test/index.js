const axios = require("axios");
const {trackMixpanel} = require("../../mixpanel");

const startCrawler = async () => {
    console.log("Test processing");

    // await axios.post(
    //     'https://topwomen.careers/wp-json/custom/v1/add-company-vacancies',
    //     JSON.stringify({ "status": "OK" }),
    //     {
    //         headers: {
    //             'Content-Type': 'application/json'
    //         }
    //     }
    // )

    trackMixpanel("Company", 56, true);
}

module.exports = {
    startCrawler
}

startCrawler()