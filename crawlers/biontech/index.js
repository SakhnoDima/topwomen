const cheerio = require('cheerio');

async function fetchAllJobResponses(offset = 0) {
    const baseUrl = 'https://jobs.biontech.com/go/All-Jobs/8781301';
    const queryParams = '?q=&sortColumn=referencedate&sortDirection=desc';
    const url = `${baseUrl}/${offset}${queryParams}`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Request error: ${response.status}`);
    }

    return response;
}

(async function () {
    let offset = 0;
    const allJobs = [];

    while (true) {
        const response = await fetchAllJobResponses(offset);

        const html = await response.text();

        const $ = cheerio.load(html);

        $('.data-row').each((_, element) => {
            const jobTitle = $(element).find('.jobTitle-link').text().trim();
            const jobLink = $(element).find('.jobTitle-link').attr('href');
            const jobLocation = $(element).find('.jobLocation').first().text().trim();
            const jobDate = $(element).find('.jobDate').first().text().trim();

            const job = {
                title: jobTitle,
                url: `https://jobs.biontech.com${jobLink}`,
                location: jobLocation,
                sector: null,
            };

            allJobs.push(job);
        });

        if ($('.data-row').length < 100) {
            break;
        }

        offset += 100;
    }

    console.log('All vacancies:', allJobs);
})();
