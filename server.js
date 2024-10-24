const http = require('http');

const { startCrawler } = require("./crawlers/euroclear/index");

const PORT = 3000;

const server = http.createServer((req, res) => {
    const { url, method } = req;

    if (method === 'GET') {
        res.statusCode = 200;
        startCrawler()
            .then(responseBody => {
                // Встановлюємо заголовок для JSON
                res.setHeader('Content-Type', 'application/json');
                // Відправляємо відповідь у форматі JSON
                res.end(JSON.stringify({
                    status: 'success',
                    data: responseBody
                }));
            })
            .catch(error => {
                // Встановлюємо статус і заголовок для помилки
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                // Відправляємо повідомлення про помилку в JSON-форматі
                res.end(JSON.stringify({
                    status: 'error',
                    message: 'Internal server error',
                    error: error.toString()
                }));
            });
    }

    else if (method === 'DELETE') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
        res.end('DELETE request');
    }

    else {
        res.statusCode = 405;
        res.setHeader('Content-Type', 'text/plain');
        res.end(`Method ${method} not allowed`);
    }
});

server.listen(PORT, () => {
    console.log(`Server started at port ${PORT}`);
});