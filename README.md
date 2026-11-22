# Практична 6. Web service

- `server/` — веб-сервіс на Node.js (Render → **Web Service**)
- `client/` — персональний сайт викладача, клієнт сервісу (Render → **Static Site**)

## Локальний запуск
```
cd server
npm start
```
Потім відкрити `client/index.html` у браузері — клієнт сам звертається до `http://localhost:3000`.

## Розгортання на render.com
1. Завантажити цю папку в репозиторій GitHub.
2. Render → New → **Web Service** → вибрати репозиторій:
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Instance Type: Free
3. Скопіювати адресу сервісу (напр. `https://umsf-site-api.onrender.com`) і вставити її в `client/api.js` (константа `API_URL`), закомітити.
4. Render → New → **Static Site** → той самий репозиторій:
   - Root Directory: `client`
   - Build Command: порожньо
   - Publish Directory: `.`
5. Відкрити адресу Static Site — дисципліни завантажуються з сервера, форма надсилає повідомлення на `/api/feedback`.

## API
| Метод | Маршрут | Опис |
|---|---|---|
| GET | `/api/disciplines?level=bachelor\|master` | список дисциплін |
| GET | `/api/sum?a=1&b=2` | сума двох чисел |
| POST | `/api/feedback` | `{ name, email, message }` |
| GET | `/api/feedback` | отримані повідомлення |
