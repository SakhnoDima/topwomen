const http = require('http');
const cron = require('node-cron');

const { startCrawler: euroclearCrawler } = require('./crawlers/euroclear/index');
const { startCrawler: testCrawler } = require('./crawlers/test/index');

const tasks = {};

const PORT = 3000;

const server = http.createServer((req, res) => {
    const { url, method } = req;

    if (url === '/crawlers/test') {
        if (method === 'GET') {
            if (!tasks['test']) {
                tasks['test'] = cron.schedule('*/1 * * * * *', testCrawler);
                console.log('Cron task for test scheduled');
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ status: 'success', message: 'Cron task for test scheduled' }));
            } else {
                res.statusCode = 400;
                res.end(JSON.stringify({ status: 'error', message: 'Cron task for test is already scheduled' }));
            }
        } else if (method === 'DELETE') {
            // Видаляємо cron задачу для функції 2
            if (tasks['test']) {
                tasks['test'].stop();
                delete tasks['test'];
                console.log('Cron task for test removed');
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ status: 'success', message: 'Cron task for test removed' }));
            } else {
                res.statusCode = 400;
                res.end(JSON.stringify({ status: 'error', message: 'No cron task for test to remove' }));
            }
        } else {
            res.statusCode = 405;
            res.end(`Method ${method} not allowed`);
        }
    } else if (url === '/crawlers/euroclear') {
        if (method === 'GET') {
            if (!tasks['euroclear']) {
                tasks['euroclear'] = cron.schedule('*/10 * * * *', euroclearCrawler, { scheduled: true });
                console.log('Cron task for euroclear scheduled');
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ status: 'success', message: 'Cron task for euroclear scheduled' }));
            } else {
                res.statusCode = 400;
                res.end(JSON.stringify({ status: 'error', message: 'Cron task for euroclear is already scheduled' }));
            }
        } else if (method === 'DELETE') {
            if (tasks['euroclear']) {
                tasks['euroclear'].stop();
                delete tasks['euroclear'];
                console.log('Cron task for euroclear removed');
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ status: 'success', message: 'Cron task for euroclear removed' }));
            } else {
                res.statusCode = 400;
                res.end(JSON.stringify({ status: 'error', message: 'No cron task for euroclear to remove' }));
            }
        } else {
            res.statusCode = 405;
            res.end(`Method ${method} not allowed`);
        }
    }

    else {
        res.statusCode = 404;
        res.end('Route not found');
    }
});

server.listen(PORT, () => {
    console.log(`Server http://localhost:${PORT} started`);
});