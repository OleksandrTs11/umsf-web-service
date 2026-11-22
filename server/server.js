// Веб-сервіс для персонального сайту викладача (Node.js, без сторонніх бібліотек)
// Маршрути:
//   GET  /                      — інформація про сервіс
//   GET  /api/disciplines       — список дисциплін (фільтр: ?level=bachelor | master)
//   GET  /api/sum?a=1&b=2       — сума двох чисел (з прикладу до завдання)
//   POST /api/feedback          — надіслати повідомлення зворотного зв'язку (JSON)
//   GET  /api/feedback          — переглянути отримані повідомлення

const http = require('http');
const url = require('url');

// Render передає порт через змінну середовища PORT; локально — 3000
const PORT = process.env.PORT || 3000;

const SYLLABUS_URL = 'http://umsf.dp.ua/index.php/struktura/2021-03-09-08-35-26/kafedra-kompiuternykh-nauk-ta-inzhenerii-prohramnoho-zabezpechennia';

// Дані про дисципліни
const disciplines = [
    { id: 1, title: "Комп'ютерна дискретна математика", level: 'bachelor', levelLabel: '121/122 Бакалаврат', syllabus: SYLLABUS_URL },
    { id: 2, title: 'Теорія алгоритмів', level: 'bachelor', levelLabel: '121/122 Бакалаврат', syllabus: SYLLABUS_URL },
    { id: 3, title: 'Сучасні методи теорії інформації та кодування', level: 'bachelor', levelLabel: '121/122 Бакалаврат', syllabus: SYLLABUS_URL },
    { id: 4, title: 'Теорія прийняття рішень', level: 'master', levelLabel: '121/122 Магістратура', syllabus: SYLLABUS_URL },
    { id: 5, title: 'Інтелектуальні системи підтримки прийняття рішень', level: 'master', levelLabel: '121/122 Магістратура', syllabus: SYLLABUS_URL },
    { id: 6, title: 'Методи та системи штучного інтелекту', level: 'master', levelLabel: '121/122 Магістратура', syllabus: SYLLABUS_URL }
];

// Повідомлення зворотного зв'язку зберігаються в пам'яті сервера
const feedback = [];

// Відправлення відповіді у форматі JSON
function sendJson(res, status, data) {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(data));
}

// Читання тіла POST-запиту (обмеження — 10 КБ)
function readBody(req, callback) {
    let body = '';
    req.on('data', chunk => {
        body += chunk;
        if (body.length > 10 * 1024) {
            callback(new Error('too large'));
            req.destroy();
        }
    });
    req.on('end', () => callback(null, body));
}

const server = http.createServer((req, res) => {
    // Заголовки CORS — щоб клієнт з іншого домену міг звертатися до сервісу
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Попередній (preflight) запит браузера перед POST з JSON
    if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        return res.end();
    }

    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    const query = parsedUrl.query;

    // Головна сторінка сервісу
    if (path === '/' && req.method === 'GET') {
        return sendJson(res, 200, {
            service: 'UMSF teacher site API',
            routes: ['GET /api/disciplines', 'GET /api/sum?a=&b=', 'POST /api/feedback', 'GET /api/feedback']
        });
    }

    // Список дисциплін
    if (path === '/api/disciplines' && req.method === 'GET') {
        const level = query.level;
        const result = level ? disciplines.filter(d => d.level === level) : disciplines;
        return sendJson(res, 200, result);
    }

    // Сума двох чисел (маршрут з прикладу)
    if (path === '/api/sum' && req.method === 'GET') {
        const a = parseFloat(query.a);
        const b = parseFloat(query.b);
        if (isNaN(a) || isNaN(b)) {
            return sendJson(res, 400, { error: 'Parameters "a" and "b" must be valid numbers' });
        }
        return sendJson(res, 200, { a: a, b: b, sum: a + b });
    }

    // Прийом повідомлення зворотного зв'язку
    if (path === '/api/feedback' && req.method === 'POST') {
        return readBody(req, (err, body) => {
            if (err) return sendJson(res, 413, { error: 'Повідомлення занадто велике' });

            let data;
            try {
                data = JSON.parse(body);
            } catch (e) {
                return sendJson(res, 400, { error: 'Некоректний JSON' });
            }

            const name = String(data.name || '').trim();
            const email = String(data.email || '').trim();
            const message = String(data.message || '').trim();

            // Перевірка обов'язкових полів
            if (!name || !email || !message) {
                return sendJson(res, 400, { error: "Заповніть усі поля: ім'я, пошта, повідомлення" });
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return sendJson(res, 400, { error: 'Некоректна електронна пошта' });
            }

            const item = { id: feedback.length + 1, name, email, message, date: new Date().toISOString() };
            feedback.push(item);
            console.log('Нове повідомлення:', item);
            return sendJson(res, 201, { ok: true, id: item.id });
        });
    }

    // Перегляд отриманих повідомлень
    if (path === '/api/feedback' && req.method === 'GET') {
        return sendJson(res, 200, feedback);
    }

    // Невідомий маршрут
    sendJson(res, 404, { error: 'Route not found' });
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
