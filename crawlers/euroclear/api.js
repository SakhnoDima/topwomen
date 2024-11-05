async function fetchJobRequisitions(offset) {
    try {
        const response = await fetch(`https://don.fa.em2.oraclecloud.com/hcmRestApi/resources/latest/recruitingCEJobRequisitions?onlyData=true&expand=requisitionList.secondaryLocations,flexFieldsFacet.values,requisitionList.requisitionFlexFields&finder=findReqs;siteNumber=CX_1003,facetsList=LOCATIONS%3BWORK_LOCATIONS%3BWORKPLACE_TYPES%3BTITLES%3BCATEGORIES%3BORGANIZATIONS%3BPOSTING_DATES%3BFLEX_FIELDS,limit=25,sortBy=POSTING_DATES_DESC,offset=${offset}`, {
            headers: {
                accept: '*/*',
                'accept-language': 'en',
                'content-type': 'application/vnd.oracle.adf.resourceitem+json;charset=utf-8',
                'ora-irc-cx-userid': 'e9d25eee-c511-47f9-8ad0-85784b9333e4',
                'ora-irc-language': 'en',
                'sec-ch-ua': '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"macOS"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
            },
            referrer: 'https://don.fa.em2.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1003/requisitions',
            referrerPolicy: 'strict-origin-when-cross-origin',
            body: null,
            method: 'GET',
            mode: 'cors',
            credentials: 'include',
        });

        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error executing request:', error);
    }
}

fetchJobRequisitions(25);

//Copy/Paste to terminal: node crawlers/euroclear/api.js
