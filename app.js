const input = document.querySelector("#requests input");
const msg = document.querySelector("#requests .msg");
const cities = document.getElementById("results");
const background = document.getElementById("background");
const weatherApiKey = "69208895504e85a8607e9779c694eab2";
const pexelsApiKey = "x28BO249ewyZrZpyydOufPBagTofB16gB8F9CbH5UxzfZDPLfsjANORU";

// Simple falling dots animation
const canvas = document.getElementById("particles");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const dotsArray = [];

class Dot {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = -10;
        this.size = Math.random() * 3 + 1;
        this.speedY = Math.random() * 1 + 0.5;
    }
    update() {
        this.y += this.speedY;
        if (this.y > canvas.height) {
            this.y = -10;
            this.x = Math.random() * canvas.width;
        }
    }
    draw() {
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function initDots() {
    for (let i = 0; i < 30; i++) {
        dotsArray.push(new Dot());
    }
}

function animateDots() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < dotsArray.length; i++) {
        dotsArray[i].update();
        dotsArray[i].draw();
    }
    requestAnimationFrame(animateDots);
}

initDots();
animateDots();

// Funzione di ricerca
function searchCity() {
    const city = input.value.trim();
    if (!city) return;

    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${weatherApiKey}&units=metric`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${weatherApiKey}&units=metric`;
    const pexelsUrl = `https://api.pexels.com/v1/search?query=${city}&per_page=1`;

    fetch(weatherUrl)
        .then(response => {
            if (!response.ok) throw new Error("Errore di rete");
            return response.json();
        })
        .then(data => {
            const cityName = data.name;
            const country = data.sys.country;
            const temp = Math.round(data.main.temp);
            const humidity = data.main.humidity;
            const windSpeed = data.wind.speed;
            const icon = `https://s3-us-west-2.amazonaws.com/s.cdpn.io/162656/${data.weather[0].icon}.svg`;
            const caption = data.weather[0].description;

            if (cities.querySelector(`.card-meteo-title span`)?.textContent.toLowerCase() === cityName.toLowerCase()) {
                msg.textContent = "Questa città è già presente!";
                setTimeout(() => msg.textContent = "", 3000);
                return;
            }

            fetch(forecastUrl)
                .then(response => response.json())
                .then(forecastData => {
                    const dailyForecasts = forecastData.list.filter(item => item.dt_txt.includes("12:00:00")).slice(0, 5);
                    let forecastHtml = '<div class="forecast">';
                    dailyForecasts.forEach(day => {
                        const date = new Date(day.dt * 1000).toLocaleDateString("it-IT", { weekday: "short", day: "numeric" });
                        const temp = Math.round(day.main.temp);
                        const icon = `https://s3-us-west-2.amazonaws.com/s.cdpn.io/162656/${day.weather[0].icon}.svg`;
                        forecastHtml += `
                            <div class="forecast-day">
                                <span>${date}</span>
                                <img src="${icon}" alt="${day.weather[0].description}">
                                <span>${temp}°C</span>
                            </div>
                        `;
                    });
                    forecastHtml += '</div>';

                    const card = document.createElement("div");
                    card.classList.add("card-meteo");
                    card.innerHTML = `
                        <div class="card-meteo-header">
                            <h2 class="card-meteo-title">
                                <span>${cityName}</span>
                                <sup>${country}</sup>
                            </h2>
                            <button class="remove-btn">×</button>
                        </div>
                        <div class="card-meteo-body">
                            <div class="card-meteo-temp">
                                <span>${temp}</span>
                                <sup>°C</sup>
                            </div>
                            <figure class="card-meteo-figure">
                                <img src="${icon}" alt="${caption}">
                                <figcaption>${caption}</figcaption>
                            </figure>
                        </div>
                        <div class="card-meteo-details">
                            <span>Umidità: ${humidity}%</span>
                            <span>Vento: ${windSpeed} m/s</span>
                        </div>
                        ${forecastHtml}
                    `;

                    card.querySelector(".remove-btn").addEventListener("click", () => card.remove());
                    cities.appendChild(card);

                    fetch(pexelsUrl, {
                        headers: { Authorization: pexelsApiKey }
                    })
                        .then(response => response.json())
                        .then(imageData => {
                            if (imageData.photos?.length > 0) {
                                background.style.backgroundImage = `url(${imageData.photos[0].src.large})`;
                                background.classList.add("active");
                            } else {
                                background.style.backgroundImage = `url('https://i.imgur.com/5Z5Kk1M.png')`;
                                background.classList.add("active");
                            }
                        });
                });
        })
        .catch(error => {
            msg.textContent = error.message === "Errore di rete" ? "Problema di connessione!" : "Città non trovata!";
            setTimeout(() => msg.textContent = "", 3000);
        });

    input.value = "";
    input.focus();
}

document.querySelector("#requests div").addEventListener("click", event => {
    if (event.target.tagName === "BUTTON") {
        event.preventDefault();
        searchCity();
    }
});

input.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        event.preventDefault();
        searchCity();
    }
});