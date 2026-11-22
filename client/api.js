/*
 * api.js — клієнт веб-сервісу.
 * 1) Завантажує список дисциплін з сервера (сторінка disciplines.html).
 * 2) Надсилає форму зворотного зв'язку на сервер (футер на всіх сторінках).
 */

// Адреса веб-сервісу. Після розгортання на Render замініть на свою адресу.
const API_URL = (location.protocol === 'file:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'http://localhost:3000'
    : 'https://umsf-site-api.onrender.com';

// ---------- Дисципліни ----------
async function loadDisciplines() {
    const list = document.getElementById('disciplines-list');
    if (!list) return; // на цій сторінці немає списку дисциплін

    list.innerHTML = '<p>Завантаження з сервера… (після простою сервер на Render може прокидатися до хвилини)</p>';

    try {
        const response = await fetch(API_URL + '/api/disciplines');
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Помилка сервера');

        list.innerHTML = '';
        data.forEach(d => {
            const card = document.createElement('div');
            card.className = 'card';

            const level = document.createElement('span');
            level.className = 'level';
            level.textContent = '[' + d.levelLabel + ']';

            const title = document.createElement('p');
            title.textContent = d.title;

            const link = document.createElement('a');
            link.href = d.syllabus;
            link.target = '_blank';
            link.className = 'btn full';
            link.innerHTML = '<i class="fa-solid fa-download"></i> Силабус (PDF)';

            card.append(level, title, link);
            list.appendChild(card);
        });
    } catch (error) {
        list.innerHTML = '';
        const p = document.createElement('p');
        p.className = 'error';
        p.textContent = 'Не вдалося завантажити дисципліни з сервера. ';
        const retry = document.createElement('button');
        retry.className = 'btn';
        retry.textContent = 'Спробувати ще раз';
        retry.addEventListener('click', loadDisciplines);
        list.append(p, retry);
    }
}

// ---------- Зворотний зв'язок ----------
function setupFeedbackForms() {
    document.querySelectorAll('form.feedback-form').forEach(form => {
        const status = document.createElement('p');
        status.className = 'form-status';
        form.appendChild(status);

        form.addEventListener('submit', async (e) => {
            e.preventDefault(); // не перезавантажувати сторінку

            const button = form.querySelector('button[type="submit"]');
            const payload = {
                name: form.elements.name.value,
                email: form.elements.email.value,
                message: form.elements.message.value
            };

            button.disabled = true;
            status.className = 'form-status';
            status.textContent = 'Надсилання…';

            try {
                const response = await fetch(API_URL + '/api/feedback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await response.json();

                if (response.ok) {
                    status.className = 'form-status ok';
                    status.textContent = 'Дякуємо! Повідомлення №' + data.id + ' надіслано.';
                    form.reset();
                } else {
                    status.className = 'form-status error';
                    status.textContent = data.error || 'Помилка сервера';
                }
            } catch (error) {
                status.className = 'form-status error';
                status.textContent = 'Не вдалося з\'єднатися з сервером';
            } finally {
                button.disabled = false;
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadDisciplines();
    setupFeedbackForms();
});
