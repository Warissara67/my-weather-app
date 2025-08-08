const apiKey = 'f7f953ecc0ae342fa03edd132b7ac2a4';

const searchForm = document.querySelector('#search-form');
const cityInput = document.querySelector('#city-input');
const weatherInfoContainer = document.querySelector('#weather-info-container');
const forecastContainer = document.querySelector('#forecast-container');
const clearHistoryBtn = document.querySelector('#clear-history');

searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const cityName = cityInput.value.trim();
    if (cityName) {
        getWeather(cityName);
        saveCityToHistory(cityName);
    } else {
        alert('กรุณาป้อนชื่อเมือง');
    }
});

window.addEventListener('load', () => {
    renderHistory();
    const lastCity = localStorage.getItem('lastCity');
    if (lastCity) {
        getWeather(lastCity);
    }
});

async function getWeather(city) {
    weatherInfoContainer.innerHTML = `<p>กำลังโหลดข้อมูล...</p>`;
    forecastContainer.innerHTML = '';

    const currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=th`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric&lang=th`;

    try {
        const [weatherRes, forecastRes] = await Promise.all([
            fetch(currentUrl),
            fetch(forecastUrl)
        ]);

        if (!weatherRes.ok || !forecastRes.ok) throw new Error('ไม่พบข้อมูลเมืองนี้');

        const weatherData = await weatherRes.json();
        const forecastData = await forecastRes.json();

        displayWeather(weatherData);
        displayForecast(forecastData);
        saveCityToHistory(city);
    } catch (error) {
        weatherInfoContainer.innerHTML = `<p class="error">${error.message}</p>`;
    }
}

function displayWeather(data) {
    const { name, main, weather } = data;
    const { temp, humidity } = main;
    const { description, icon } = weather[0];

    const weatherHtml = `
        <h2>${name}</h2>
        <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${description}">
        <p class="temp">${temp.toFixed(1)}°C</p>
        <p>${description}</p>
        <p>ความชื้น: ${humidity}%</p>
    `;
    weatherInfoContainer.innerHTML = weatherHtml;
}

function displayForecast(data) {
    forecastContainer.innerHTML = '';
    const dailyForecast = data.list.filter(item => item.dt_txt.includes('12:00:00')).slice(0, 5);

    dailyForecast.forEach(day => {
        const date = new Date(day.dt_txt);
        const dayName = date.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' });
        const icon = day.weather[0].icon;
        const temp = day.main.temp.toFixed(1);

        const html = `
            <div class="forecast-item">
                <div>${dayName}</div>
                <img src="https://openweathermap.org/img/wn/${icon}.png" alt="">
                <div>${temp}°C</div>
            </div>
        `;
        forecastContainer.innerHTML += html;
    });
}

function saveCityToHistory(city) {
    let history = JSON.parse(localStorage.getItem('cityHistory')) || [];
    if (!history.includes(city)) {
        history.unshift(city);
        if (history.length > 5) history = history.slice(0, 5);
        localStorage.setItem('cityHistory', JSON.stringify(history));
    }
    localStorage.setItem('lastCity', city);
    renderHistory();
}

function renderHistory() {
    const history = JSON.parse(localStorage.getItem('cityHistory')) || [];
    const tagList = document.querySelector('#tag-list');
    tagList.innerHTML = '';

    history.forEach((city, index) => {
        const tag = document.createElement('div');
        tag.className = 'tag';
        tag.innerHTML = `${city}<span data-index="${index}">&times;</span>`;

        tag.addEventListener('click', (e) => {
            if (e.target.tagName !== 'SPAN') {
                getWeather(city);
                saveCityToHistory(city);
            }
        });

        tag.querySelector('span').addEventListener('click', (e) => {
            e.stopPropagation();
            removeCityFromHistory(index);
        });

        tagList.appendChild(tag);
    });
}

function removeCityFromHistory(index) {
    let history = JSON.parse(localStorage.getItem('cityHistory')) || [];
    history.splice(index, 1);
    localStorage.setItem('cityHistory', JSON.stringify(history));

    if (index === 0 && history.length > 0) {
        localStorage.setItem('lastCity', history[0]);
    } else if (history.length === 0) {
        localStorage.removeItem('lastCity');
    }

    renderHistory();
}

clearHistoryBtn.addEventListener('click', () => {
    localStorage.removeItem('cityHistory');
    localStorage.removeItem('lastCity');
    renderHistory();
});
