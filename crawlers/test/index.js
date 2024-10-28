const axios = require("axios");
const startCrawler = async () => {
    console.log("Test processing");

    await axios.post(
        'https://topwomen.careers/wp-json/custom/v1/add-company-vacancies',
        JSON.stringify({ "status": "OK" }),
        {
            headers: {
                'Content-Type': 'application/json'
            }
        }
    )
}

module.exports = {
    startCrawler
}