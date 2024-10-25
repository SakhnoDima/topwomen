const axios = require("axios");
const startCrawler = async () => {
    console.log("Test processing");

    await axios.post(
        'http://localhost:3001',
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