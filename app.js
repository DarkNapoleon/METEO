const input = document.querySelector("#requests input");
const msg = document.querySelector("#requests .msg");
const cities = document.getElementById("results");
const background = document.getElementById("background");
const weatherApiKey = "69208895504e85a8607e9779c694eab2"; 
const pexelsApiKey = "x28BO249ewyZrZpyydOufPBagTofB16gB8F9CbH5UxzfZDPLfsjANORU"; 

const canvas = document.getElementById("particles");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const dotsArray = [];
const numberOfDots = window.innerWidth < 768 ? 15 : 30; 

class Dot {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = -10;
        this.size = Math.random() * 2.5 + 0.5; 
        this.speedY = Math.random() * 0.8 + 0.2; 
    }
    update() {
        this.y += this.speedY;
        if (this.y > canvas.height + 10) { 
            this.y = -10;
            this.x = Math.random() * canvas.width;
        }
    }
    draw() {
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)"; 
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function initDots() {
    dotsArray.length = 0; 
    for (let i = 0; i < numberOfDots; i++) {
        dotsArray.push(new Dot());
    }
}

let animationFrameId;
function animateDots() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < dotsArray.length; i++) {
        dotsArray[i].update();
        dotsArray[i].draw();
    }
    animationFrameId = requestAnimationFrame(animateDots);
}

initDots();
animateDots();


function searchCity() {
    const city = input.value.trim();
    if (!city) {
        msg.textContent = "Per favore, inserisci il nome di una città.";
        setTimeout(() => msg.textContent = "", 3000);
        input.focus();
        return;
    }

   
    msg.textContent = "Ricerca in corso...";

    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${weatherApiKey}&units=metric&lang=it`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${weatherApiKey}&units=metric&lang=it`;
    const pexelsUrl = `https://api.pexels.com/v1/search?query=${encodeURIComponent(city)}%20cityscape&per_page=1&orientation=landscape`;

    fetch(weatherUrl)
        .then(response => {
            if (!response.ok) {
                if (response.status === 404) throw new Error("Città non trovata.");
                throw new Error("Errore di rete o del server meteo.");
            }
            return response.json();
        })
        .then(data => {
            const cityName = data.name;
            const country = data.sys.country;
            const temp = Math.round(data.main.temp);
            const humidity = data.main.humidity;
            const windSpeed = (data.wind.speed * 3.6).toFixed(1); 
            const icon = `https://s3-us-west-2.amazonaws.com/s.cdpn.io/162656/${data.weather[0].icon}.svg`;
            const caption = data.weather[0].description;
            const lat = data.coord.lat;
            const lon = data.coord.lon;

           
            const existingCities = Array.from(cities.querySelectorAll(".card-meteo-title span"));
            if (existingCities.some(el => el.textContent.toLowerCase() === cityName.toLowerCase())) {
                msg.textContent = `La città di ${cityName} è già visualizzata!`;
                setTimeout(() => msg.textContent = "", 3000);
                input.value = "";
                input.focus();
                return;
            }
            msg.textContent = ""; 

            fetch(forecastUrl)
                .then(response => {
                    if (!response.ok) throw new Error("Errore nel caricare le previsioni.");
                    return response.json();
                })
                .then(forecastData => {
                    const forecastsByDay = {};
                    forecastData.list.forEach(item => {
                        const date = new Date(item.dt * 1000);
                        const dayKey = date.toLocaleDateString("it-IT", { weekday: "long", day: "numeric" }); 
                        
                        if (!forecastsByDay[dayKey]) {
                            forecastsByDay[dayKey] = [];
                        }
                        
                        forecastsByDay[dayKey].push({
                            hour: date.getHours().toString().padStart(2, '0'), 
                            temp: Math.round(item.main.temp),
                            icon: `https://s3-us-west-2.amazonaws.com/s.cdpn.io/162656/${item.weather[0].icon}.svg`,
                            description: item.weather[0].description,
                            humidity: item.main.humidity,
                            windSpeed: (item.wind.speed * 3.6).toFixed(1), 
                            timestamp: item.dt
                        });
                    });

                    const dailyKeys = Object.keys(forecastsByDay).slice(0, 5);
                    
                    let forecastHtml = '<div class="forecast">';
                    dailyKeys.forEach((dayKey, index) => {
                        
                        const representativeForecast = forecastsByDay[dayKey].find(f => f.hour === "12" || f.hour === "13" || f.hour === "14") || forecastsByDay[dayKey][0];
                        const active = index === 0 ? 'active' : '';
                        const shortDayName = new Date(representativeForecast.timestamp * 1000).toLocaleDateString("it-IT", { weekday: "short" });


                        forecastHtml += `
                            <div class="forecast-day ${active}" data-day="${dayKey}" title="${dayKey}">
                                <span>${shortDayName}</span>
                                <img src="${representativeForecast.icon}" alt="${representativeForecast.description}">
                                <span>${representativeForecast.temp}°C</span>
                            </div>
                        `;
                    });
                    forecastHtml += '</div>';

                    let detailsHtml = '<div class="forecast-details">';
                    dailyKeys.forEach((dayKey, index) => {
                        const display = index === 0 ? 'block' : 'none';
                        
                        detailsHtml += `<div class="day-details" data-day="${dayKey}" style="display: ${display}">`;
                        detailsHtml += `<h3>Previsioni per ${dayKey}</h3>`;
                        detailsHtml += `<div class="hourly-forecast">`;
                        
                        forecastsByDay[dayKey].forEach(hourData => {
                            detailsHtml += `
                                <div class="hour-card">
                                    <span class="hour">${hourData.hour}:00</span>
                                    <img src="${hourData.icon}" alt="${hourData.description}">
                                    <span class="temp">${hourData.temp}°C</span>
                                    <span class="desc">${hourData.description}</span>
                                    <div class="extra-details">
                                        <span>Umidità: ${hourData.humidity}%</span>
                                        <span>Vento: ${hourData.windSpeed} km/h</span>
                                    </div>
                                </div>
                            `;
                        });
                        detailsHtml += `</div></div>`;
                    });
                    detailsHtml += '</div>';

                    const card = document.createElement("div");
                    card.classList.add("card-meteo-container");
                    
                    const mapId = `map-${cityName.replace(/\s+/g, '-')}-${Date.now()}`; 

                    card.innerHTML = `
                        <div class="card-meteo">
                            <div class="card-meteo-header">
                                <h2 class="card-meteo-title">
                                    <span>${cityName}</span>
                                    <sup>${country}</sup>
                                </h2>
                                <button class="remove-btn" title="Rimuovi città">×</button>
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
                                <span>Vento: ${windSpeed} km/h</span>
                            </div>
                            <div id="${mapId}" class="leaflet-map-container"></div>
                            ${forecastHtml}
                        </div>
                        <div class="card-details-panel">
                            ${detailsHtml}
                        </div>
                    `;
                    
                  
                    cities.prepend(card); 
                    card.scrollIntoView({ behavior: 'smooth', block: 'start' });


                   
                    try {
                        const cityMap = L.map(mapId, {
                            zoomControl: false, 
                            attributionControl: false 
                        }).setView([lat, lon], 11); 

                        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                            maxZoom: 18, 
                            
                        }).addTo(cityMap);
                        
                        L.control.attribution({
                            prefix: '<a href="https://leafletjs.com" title="A JS library for interactive maps">Leaflet</a> | © <a href="https://www.openstreetmap.org/copyright" target="_blank">OSM</a>',
                            position: 'bottomright'
                        }).addTo(cityMap);

                        L.marker([lat, lon]).addTo(cityMap)
                            .bindPopup(`<b>${cityName}</b>`)
                            .openPopup();
                        
                       
                        setTimeout(() => {
                            cityMap.invalidateSize();
                        }, 400); 

                    } catch (e) {
                        console.error("Errore durante l'inizializzazione della mappa Leaflet:", e);
                        const mapDiv = card.querySelector(`#${mapId}`);
                        if(mapDiv) mapDiv.innerHTML = "<p style='text-align:center; padding: 20px; color: #777;'>Impossibile caricare la mappa.</p>";
                    }

                    
                    card.querySelector(".remove-btn").addEventListener("click", (e) => {
                        e.stopPropagation(); 
                        card.style.animation = 'cardDisappear 0.5s ease forwards';
                        card.addEventListener('animationend', () => {
                            card.remove();
                            if (cities.children.length === 0) { 
                                background.classList.remove("active"); 
                                background.style.backgroundImage = ''; 
                            }
                        });
                    });
                    
                    
                    const forecastDays = card.querySelectorAll('.forecast-day');
                    const detailPanels = card.querySelectorAll('.day-details');
                    const detailsPanelContainer = card.querySelector('.card-details-panel');

                    forecastDays.forEach(dayEl => {
                        dayEl.addEventListener('click', () => {
                            const selectedDay = dayEl.dataset.day;
                            
                            forecastDays.forEach(el => el.classList.remove('active'));
                            dayEl.classList.add('active');
                            
                            let foundActive = false;
                            detailPanels.forEach(detailEl => {
                                if (detailEl.dataset.day === selectedDay) {
                                    detailEl.style.display = 'block';
                                    foundActive = true;
                                } else {
                                    detailEl.style.display = 'none';
                                }
                            });

                            if(foundActive) {
                                detailsPanelContainer.classList.add('visible');
                            } else {
                                detailsPanelContainer.classList.remove('visible');
                            }
                        });
                    });
                     
                    if (forecastDays.length > 0) {
                        forecastDays[0].click();
                    }


                   
                    fetch(pexelsUrl, {
                        headers: { Authorization: pexelsApiKey }
                    })
                        .then(response => response.json())
                        .then(imageData => {
                            if (imageData.photos?.length > 0) {
                                background.style.backgroundImage = `url(${imageData.photos[0].src.large2x || imageData.photos[0].src.large})`;
                                background.classList.add("active");
                            } else {
                               
                                console.warn("Nessuna immagine trovata su Pexels per:", cityName);
                                if (!background.classList.contains('active')) {
                                     background.style.backgroundImage = `url('https://images.pexels.com/photos/209831/pexels-photo-209831.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1')`; // Immagine di default generica
                                     background.classList.add("active");
                                }
                            }
                        }).catch(err => {
                            console.warn("Errore nel caricare immagine da Pexels:", err);
                             if (!background.classList.contains('active')) {
                                background.style.backgroundImage = `url('https://images.pexels.com/photos/209831/pexels-photo-209831.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1')`;
                                background.classList.add("active");
                            }
                        });
                }).catch(error => { 
                    console.error("Errore previsioni:", error);
                    msg.textContent = error.message || "Problemi nel caricare le previsioni.";
                    setTimeout(() => msg.textContent = "", 3000);
                });
        })
        .catch(error => { //
           
            if (error.message === "Città non trovata.") {
               
            } else {
               
                console.error("Errore meteo:", error);
            }
            msg.textContent = error.message || "Si è verificato un errore.";
           
            setTimeout(() => msg.textContent = "", 4000);
        });

    input.value = "";
    input.focus();
}

document.querySelector("#requests div button").addEventListener("click", event => {
    event.preventDefault();
    searchCity();
});

input.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        event.preventDefault();
        searchCity();
    }
});


let resizeTimeout;
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    
    resizeTimeout = setTimeout(() => {
        cancelAnimationFrame(animationFrameId); 
        initDots();
        animateDots(); 
    }, 250);

   
    document.querySelectorAll('.leaflet-map-container').forEach(mapDiv => {
        if (mapDiv._leaflet_id) { 
            try { 
                const mapInstance = L.DomUtil.get(mapDiv)._leaflet; 
                if (mapInstance) {
                    mapInstance.invalidateSize();
                }
            } catch (e) {
                console.warn("Impossibile accedere all'istanza della mappa per invalidateSize durante il resize.", e);
            }
        }
    });
});


const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = `
    @keyframes cardDisappear {
        from { transform: scale(1); opacity: 1; }
        to { transform: scale(0.9); opacity: 0; }
    }
    .card-meteo-container.disappearing {
        animation: cardDisappear 0.5s ease forwards;
    }
`;
document.head.appendChild(styleSheet);
