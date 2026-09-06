/* ============================================================
   RESQ — LOCATION AUTOCOMPLETE
============================================================ */

/* ============================================================
   API
============================================================ */

const API = "https://countries.dev";

/* ============================================================
   DOM
============================================================ */

const mapImage = document.getElementById("mapImage");

const countryInput = document.getElementById("countryInput");

const cityInput = document.getElementById("cityInput");

const countryWrapper = document.getElementById("countryWrapper");

const cityWrapper = document.getElementById("cityWrapper");

const countryResults = document.getElementById("countryResults");

const cityResults = document.getElementById("cityResults");

const countryClear = document.getElementById("countryClear");

const cityClear = document.getElementById("cityClear");

const coordinates = document.getElementById("coordinates");

const locationName = document.getElementById("locationName");

const disasterSelect = document.getElementById("disasterSelect");

const launchButton = document.getElementById("launchButton");

const transition = document.getElementById("transition");

const transitionLocation = document.getElementById("transitionLocation");

/* ============================================================
   STATE
============================================================ */

let selectedCountry = null;

let selectedCity = null;

let countryTimer = null;

let cityTimer = null;

let countryResultsData = [];

let cityResultsData = [];

let activeCountryIndex = -1;

let activeCityIndex = -1;

/* ============================================================
   DEFAULT LOCATION
============================================================ */

selectedCountry = {
    name: "India",

    alpha2Code: "IN",

    flag: "🇮🇳",
};

selectedCity = {
    name: "Chennai",

    countryCode: "IN",

    latitude: 13.0827,

    longitude: 80.2707,

    population: 4646732,
};

countryInput.value = selectedCountry.name;

cityInput.disabled = false;

cityInput.placeholder = "Search city...";

cityInput.value = selectedCity.name;

countryWrapper.classList.add("has-value");

cityWrapper.classList.add("has-value");

updateLocationUI();

/* ============================================================
   RANDOM BACKGROUND
============================================================ */

const indiaMap = "https://upload.wikimedia.org/wikipedia/commons/b/b4/India_outline.svg";
mapImage.src = indiaMap;
mapImage.alt = "India map";

/* ============================================================
   COUNTRY SEARCH
============================================================ */

countryInput.addEventListener("input", function () {
    const query = this.value.trim();

    countryWrapper.classList.toggle("has-value", query.length > 0);

    clearTimeout(countryTimer);

    /*
            If user deletes everything,
            close dropdown.
        */

    if (!query) {
        countryResults.classList.remove("visible");

        return;
    }

    /*
            Don't search on one character.
        */

    if (query.length < 2) {
        return;
    }

    countryTimer = setTimeout(() => {
        searchCountries(query);
    }, 250);
});

/* ============================================================
   SEARCH COUNTRIES
============================================================ */

async function searchCountries(query) {
    try {
        showLoading(countryResults);

        const url =
            `${API}/name/${encodeURIComponent(query)}` +
            `?fields=name,alpha2Code,flag`;

        const response = await fetch(url);

        /*
            countries.dev returns 404 when
            there are no matching countries.
        */

        if (response.status === 404) {
            countryResultsData = [];

            showMessage(countryResults, "NO COUNTRIES FOUND");

            return;
        }

        if (!response.ok) {
            throw new Error("Country search failed");
        }

        const data = await response.json();

        countryResultsData = data.slice(0, 8);

        activeCountryIndex = -1;

        renderCountries(countryResultsData);
    } catch (error) {
        console.error(error);

        showMessage(countryResults, "SEARCH TEMPORARILY UNAVAILABLE");
    }
}

/* ============================================================
   RENDER COUNTRIES
============================================================ */

function renderCountries(countries) {
    countryResults.innerHTML = "";

    if (!countries.length) {
        showMessage(countryResults, "NO COUNTRIES FOUND");

        return;
    }

    countries.forEach((country, index) => {
        const item = document.createElement("div");

        item.className = "search-result";

        item.dataset.index = index;

        item.innerHTML = `

                <div class="result-flag">
                    ${country.flag || "🌍"}
                </div>

                <div class="result-info">

                    <div class="result-name">
                        ${escapeHTML(country.name)}
                    </div>

                    <div class="result-subtitle">
                        ISO ${escapeHTML(country.alpha2Code)}
                    </div>

                </div>

            `;

        item.addEventListener("click", () => {
            selectCountry(country);
        });

        countryResults.appendChild(item);
    });

    countryResults.classList.add("visible");
}

/* ============================================================
   SELECT COUNTRY
============================================================ */

function selectCountry(country) {
    selectedCountry = country;

    /*
        Reset city.
    */

    selectedCity = null;

    countryInput.value = country.name;

    cityInput.value = "";

    countryWrapper.classList.add("has-value");

    cityWrapper.classList.remove("disabled");

    cityInput.disabled = false;

    cityInput.placeholder = `Search city in ${country.name}...`;

    countryResults.classList.remove("visible");

    cityResults.classList.remove("visible");

    locationName.textContent = `${country.name} selected`;

    coordinates.innerHTML = `--° --<br>--° --`;

    /*
        Load popular cities immediately.
    */

    loadPopularCities(country.alpha2Code);

    /*
        Focus city field.
    */

    setTimeout(() => {
        cityInput.focus();
    }, 100);
}

/* ============================================================
   POPULAR CITIES
============================================================ */

async function loadPopularCities(countryCode) {
    try {
        showLoading(cityResults, "LOADING CITIES");

        const url =
            `${API}/cities` +
            `?country=${encodeURIComponent(countryCode)}` +
            `&limit=8`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("City request failed");
        }

        const cities = await response.json();

        cityResultsData = cities;

        activeCityIndex = -1;

        renderCities(cities, true);
    } catch (error) {
        console.error(error);

        showMessage(cityResults, "COULD NOT LOAD CITIES");
    }
}

/* ============================================================
   CITY INPUT
============================================================ */

cityInput.addEventListener("input", function () {
    const query = this.value.trim();

    cityWrapper.classList.toggle("has-value", query.length > 0);

    clearTimeout(cityTimer);

    if (!selectedCountry) {
        return;
    }

    /*
            Empty input:
            show popular cities again.
        */

    if (!query) {
        loadPopularCities(selectedCountry.alpha2Code);

        return;
    }

    if (query.length < 2) {
        return;
    }

    cityTimer = setTimeout(() => {
        searchCities(query);
    }, 250);
});

/* ============================================================
   SEARCH CITIES
============================================================ */

async function searchCities(query) {
    if (!selectedCountry) {
        return;
    }

    try {
        showLoading(cityResults);

        const url =
            `${API}/cities` +
            `?q=${encodeURIComponent(query)}` +
            `&country=${encodeURIComponent(selectedCountry.alpha2Code)}` +
            `&limit=8`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("City search failed");
        }

        const data = await response.json();

        cityResultsData = data;

        activeCityIndex = -1;

        renderCities(data, false);
    } catch (error) {
        console.error(error);

        showMessage(cityResults, "CITY SEARCH FAILED");
    }
}

/* ============================================================
   RENDER CITIES
============================================================ */

function renderCities(cities, popular = false) {
    cityResults.innerHTML = "";

    if (!cities.length) {
        showMessage(cityResults, "NO CITIES FOUND");

        return;
    }

    cities.forEach((city, index) => {
        const item = document.createElement("div");

        item.className = "search-result";

        item.dataset.index = index;

        const population = city.population
            ? formatPopulation(city.population)
            : "";

        item.innerHTML = `

                <div class="result-flag">
                    ${selectedCountry.flag || "📍"}
                </div>

                <div class="result-info">

                    <div class="result-name">
                        ${escapeHTML(city.name)}
                    </div>

                    <div class="result-subtitle">
                        ${
                            popular
                                ? "POPULAR CITY"
                                : escapeHTML(selectedCountry.name)
                        }
                    </div>

                </div>

                ${
                    population
                        ? `
                    <div class="result-population">
                        ${population}
                    </div>
                    `
                        : ""
                }

            `;

        item.addEventListener("click", () => {
            selectCity(city);
        });

        cityResults.appendChild(item);
    });

    cityResults.classList.add("visible");
}

/* ============================================================
   SELECT CITY
============================================================ */

function selectCity(city) {
    selectedCity = {
        ...city,

        latitude: Number(city.latitude),

        longitude: Number(city.longitude),
    };

    cityInput.value = city.name;

    cityWrapper.classList.add("has-value");

    cityResults.classList.remove("visible");

    updateLocationUI();
    validateDisasterCompatibility();

    /*
        Small map animation.
    */

    mapImage.style.transform = "scale(1.08)";

    setTimeout(() => {
        mapImage.style.transform = "scale(1.05)";
    }, 900);
}

/* ============================================================
   DISASTER COMPATIBILITY VALIDATION (LANDLOCKED VS COASTAL)
============================================================ */

function validateDisasterCompatibility() {
    if (!selectedCity) return true;
    const cityName = (selectedCity.name || "").toLowerCase();
    const disaster = (disasterSelect ? disasterSelect.value : "").toLowerCase();
    const isLandlocked = ["delhi", "bengaluru", "bangalore", "hyderabad", "jaipur", "lucknow", "bhopal", "pune", "nagpur", "patna"].some(k => cityName.includes(k));
    const isInvalid = isLandlocked && (disaster === "tsunami" || disaster === "cyclone");

    let warningEl = document.getElementById("disasterCompatibilityWarning");
    if (isInvalid) {
        if (!warningEl && disasterSelect) {
            warningEl = document.createElement("div");
            warningEl.id = "disasterCompatibilityWarning";
            warningEl.className = "compatibility-warning";
            warningEl.style.cssText = "margin-top: 8px; font-family: 'DM Mono', monospace; font-size: 8px; letter-spacing: 0.12em; color: #ef4444; background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.25); padding: 7px 10px; text-transform: uppercase;";
            disasterSelect.parentElement.after(warningEl);
        }
        if (warningEl) {
            warningEl.textContent = `⚠ ${disaster.toUpperCase()} NOT APPLICABLE FOR LANDLOCKED TERRAIN (CHOOSE FLOOD OR EARTHQUAKE)`;
            warningEl.style.display = "block";
        }
        if (launchButton) {
            launchButton.style.opacity = "0.45";
            launchButton.style.pointerEvents = "none";
            launchButton.title = "Disaster scenario not compatible with selected terrain";
        }
        return false;
    } else {
        if (warningEl) warningEl.style.display = "none";
        if (launchButton) {
            launchButton.style.opacity = "";
            launchButton.style.pointerEvents = "";
            launchButton.removeAttribute("title");
        }
        return true;
    }
}

/* ============================================================
   UPDATE LOCATION UI
============================================================ */

function updateLocationUI() {
    if (!selectedCity) {
        return;
    }

    const lat = Number(selectedCity.latitude);

    const lng = Number(selectedCity.longitude);

    const latDirection = lat >= 0 ? "N" : "S";

    const lngDirection = lng >= 0 ? "E" : "W";

    coordinates.innerHTML = `

        ${Math.abs(lat).toFixed(4)}°
        ${latDirection}<br>

        ${Math.abs(lng).toFixed(4)}°
        ${lngDirection}

    `;

    locationName.textContent = `${selectedCity.name}, ${selectedCountry.name}`;
    validateDisasterCompatibility();
}

/* ============================================================
   KEYBOARD NAVIGATION — COUNTRY
============================================================ */

countryInput.addEventListener("keydown", function (event) {
    if (!countryResults.classList.contains("visible")) {
        return;
    }

    if (event.key === "ArrowDown") {
        event.preventDefault();

        activeCountryIndex = Math.min(
            activeCountryIndex + 1,
            countryResultsData.length - 1,
        );

        updateActiveResult(countryResults, activeCountryIndex);
    } else if (event.key === "ArrowUp") {
        event.preventDefault();

        activeCountryIndex = Math.max(activeCountryIndex - 1, 0);

        updateActiveResult(countryResults, activeCountryIndex);
    } else if (event.key === "Enter") {
        event.preventDefault();

        if (activeCountryIndex >= 0 && countryResultsData[activeCountryIndex]) {
            selectCountry(countryResultsData[activeCountryIndex]);
        }
    } else if (event.key === "Escape") {
        countryResults.classList.remove("visible");
    }
});

/* ============================================================
   KEYBOARD NAVIGATION — CITY
============================================================ */

cityInput.addEventListener("keydown", function (event) {
    if (!cityResults.classList.contains("visible")) {
        return;
    }

    if (event.key === "ArrowDown") {
        event.preventDefault();

        activeCityIndex = Math.min(
            activeCityIndex + 1,
            cityResultsData.length - 1,
        );

        updateActiveResult(cityResults, activeCityIndex);
    } else if (event.key === "ArrowUp") {
        event.preventDefault();

        activeCityIndex = Math.max(activeCityIndex - 1, 0);

        updateActiveResult(cityResults, activeCityIndex);
    } else if (event.key === "Enter") {
        event.preventDefault();

        if (activeCityIndex >= 0 && cityResultsData[activeCityIndex]) {
            selectCity(cityResultsData[activeCityIndex]);
        }
    } else if (event.key === "Escape") {
        cityResults.classList.remove("visible");
    }
});

/* ============================================================
   ACTIVE DROPDOWN ITEM
============================================================ */

function updateActiveResult(container, index) {
    const items = container.querySelectorAll(".search-result");

    items.forEach((item) => {
        item.classList.remove("active");
    });

    if (!items[index]) {
        return;
    }

    items[index].classList.add("active");

    items[index].scrollIntoView({
        block: "nearest",
    });
}

/* ============================================================
   CLEAR COUNTRY
============================================================ */

countryClear.addEventListener("click", function () {
    countryInput.value = "";

    countryWrapper.classList.remove("has-value");

    selectedCountry = null;

    selectedCity = null;

    cityInput.value = "";

    cityInput.disabled = true;

    cityInput.placeholder = "Select country first...";

    cityWrapper.classList.add("disabled");

    cityWrapper.classList.remove("has-value");

    countryResults.classList.remove("visible");

    cityResults.classList.remove("visible");

    locationName.textContent = "Select a location";

    coordinates.innerHTML = `--° --<br>--° --`;
});

/* ============================================================
   CLEAR CITY
============================================================ */

cityClear.addEventListener("click", function () {
    cityInput.value = "";

    cityWrapper.classList.remove("has-value");

    selectedCity = null;

    locationName.textContent = `${selectedCountry.name} selected`;

    coordinates.innerHTML = `--° --<br>--° --`;

    cityInput.focus();

    loadPopularCities(selectedCountry.alpha2Code);
});

/* ============================================================
   CITY FOCUS
============================================================ */

cityInput.addEventListener("focus", function () {
    if (!selectedCountry) {
        return;
    }

    /*
            If nothing typed,
            show popular cities.
        */

    if (!this.value.trim()) {
        loadPopularCities(selectedCountry.alpha2Code);
    }
});

/* ============================================================
   CLICK OUTSIDE
============================================================ */

document.addEventListener("click", function (event) {
    if (!event.target.closest("#countryWrapper")) {
        countryResults.classList.remove("visible");
    }

    if (!event.target.closest("#cityWrapper")) {
        cityResults.classList.remove("visible");
    }
});

/* ============================================================
   MOUSE PARALLAX
============================================================ */

document.addEventListener("mousemove", function (event) {
    const x = event.clientX / window.innerWidth - 0.5;

    const y = event.clientY / window.innerHeight - 0.5;

    mapImage.style.transform = `
            scale(1.055)
            translate(
                ${x * -15}px,
                ${y * -15}px
            )
        `;
});

/* ============================================================
   INITIALIZE SIMULATION
============================================================ */

launchButton.addEventListener("click", function () {
    /*
            Don't allow launch without
            selecting a city.
        */

    if (!selectedCountry) {
        countryInput.focus();

        return;
    }

    if (!selectedCity) {
        cityInput.focus();

        return;
    }

    if (!validateDisasterCompatibility()) {
        return;
    }

    const simulation = {
        city: selectedCity.name,

        country: selectedCountry.name,

        countryCode: selectedCountry.alpha2Code,

        latitude: Number(selectedCity.latitude),

        longitude: Number(selectedCity.longitude),

        population: Number(selectedCity.population || 0),

        disaster: disasterSelect.value,

        createdAt: new Date().toISOString(),
    };

    /*
            Save the complete simulation
            configuration.
        */

    localStorage.setItem("resqSimulation", JSON.stringify(simulation));

    /*
            Transition.
        */

    transitionLocation.textContent = `${simulation.city}, ${simulation.country}`;

    transition.classList.add("active");

    /*
            Open dashboard.
        */

    setTimeout(function () {
        window.location.href = "dashboard.html";
    }, 1000);
});

/* ============================================================
   LOADING UI
============================================================ */

function showLoading(container, message = "SEARCHING") {
    container.innerHTML = `

        <div class="search-message">
            ${message}...
        </div>

    `;

    container.classList.add("visible");
}

/* ============================================================
   MESSAGE UI
============================================================ */

function showMessage(container, message) {
    container.innerHTML = `

        <div class="search-message">
            ${message}
        </div>

    `;

    container.classList.add("visible");
}

/* ============================================================
   FORMAT POPULATION
============================================================ */

function formatPopulation(number) {
    if (number >= 1000000) {
        return (number / 1000000).toFixed(1) + "M";
    }

    if (number >= 1000) {
        return (number / 1000).toFixed(0) + "K";
    }

    return number.toString();
}

/* ============================================================
   ESCAPE HTML
============================================================ */

function escapeHTML(value) {
    const div = document.createElement("div");

    div.textContent = value;

    return div.innerHTML;
}


/* ============================================================
   RESQ — CINEMATIC DISASTER VISUALIZATION ENGINE
   The existing landing page/UI is preserved. This canvas is a
   presentation layer that renders scenario-specific motion.
============================================================ */

const disasterCanvas = document.getElementById("disasterCanvas");
const disasterCtx = disasterCanvas ? disasterCanvas.getContext("2d") : null;
const tsunamiEffect = document.getElementById("tsunamiEffect");
const floodEffect = document.getElementById("floodEffect");
const cycloneEffect = document.getElementById("cycloneEffect");
const earthquakeEffect = document.getElementById("earthquakeEffect");

const disasterEffectElements = [tsunamiEffect, floodEffect, cycloneEffect, earthquakeEffect];
let effectRunToken = 0;
let disasterBeforeOpen = disasterSelect.value;
let activeDisaster = null;
let disasterStart = 0;
let disasterFrame = 0;
let lastFrame = performance.now();
let canvasWidth = 0;
let canvasHeight = 0;
let dpr = 1;
let particles = [];
let rings = [];
let cracks = [];
let windSeeds = [];
let rain = [];
let debris = [];

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const easeOutCubic = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
const easeInOut = (t) => t < .5 ? 2*t*t : 1-Math.pow(-2*t+2,2)/2;

function disasterPalette(type) {
    const light = document.body.classList.contains("light-mode");
    const palettes = {
        tsunami: light ? { water:[18,120,190], glow:[35,165,225], foam:[35,125,185], crest:[0,105,170] } : { water:[20,135,205], glow:[65,195,245], foam:[165,235,255], crest:[155,235,255] },
        flood: light ? { water:[18,105,165], glow:[25,145,195], surface:[0,115,170], rain:[35,110,160], debris:[65,105,125] } : { water:[20,110,175], glow:[55,180,225], surface:[120,220,250], rain:[145,220,250], debris:[185,225,235] },
        cyclone: light ? { wind:[35,80,125], glow:[20,115,175], eye:[35,100,155] } : { wind:[185,225,245], glow:[80,185,230], eye:[175,235,255] },
        earthquake: light ? { crack:[155,55,25], shock:[180,80,35], dust:[95,85,75] } : { crack:[235,145,70], shock:[255,175,80], dust:[225,210,190] }
    };
    return palettes[type] || palettes.tsunami;
}
function rgba(c,a){ return `rgba(${c[0]},${c[1]},${c[2]},${a})`; }


function resizeDisasterCanvas() {
    if (!disasterCanvas || !disasterCtx) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight;
    disasterCanvas.width = Math.floor(canvasWidth * dpr);
    disasterCanvas.height = Math.floor(canvasHeight * dpr);
    disasterCanvas.style.width = `${canvasWidth}px`;
    disasterCanvas.style.height = `${canvasHeight}px`;
    disasterCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function clearCanvas() {
    if (!disasterCtx) return;
    disasterCtx.clearRect(0, 0, canvasWidth, canvasHeight);
}

function resetSimulationArrays() {
    particles = [];
    rings = [];
    cracks = [];
    windSeeds = [];
    rain = [];
    debris = [];
}

function spawnRing(x, y, maxRadius, life, type = "shock") {
    rings.push({ x, y, radius: 4, maxRadius, life, age: 0, type });
}

function seeded(n) {
    const x = Math.sin(n * 12.9898) * 43758.5453;
    return x - Math.floor(x);
}

function createTsunami() {
    resetSimulationArrays();
    for (let i = 0; i < 110; i++) {
        particles.push({
            x: -80 + seeded(i+1) * canvasWidth * .42,
            y: canvasHeight * (.20 + seeded(i+2) * .68),
            vx: 180 + seeded(i+3) * 480,
            vy: -25 + seeded(i+4) * 50,
            size: 1 + seeded(i+5) * 4,
            life: seeded(i+6),
            alpha: .12 + seeded(i+7) * .48
        });
    }
    for (let i = 0; i < 7; i++) {
        spawnRing(canvasWidth * .03, canvasHeight * (.26 + i*.08), 180 + i*85, 2.4 + i*.12, "wave");
    }
}

function drawTsunami(t, dt) {
    const p = clamp(t / 5.2, 0, 1);
    const ctx = disasterCtx;
    const c = disasterPalette("tsunami");
    const surge = easeInOut(clamp(t / 2.5, 0, 1));
    const fade = t < .35 ? t/.35 : t > 4.4 ? 1-(t-4.4)/.8 : 1;

    ctx.save();
    ctx.globalCompositeOperation = "screen";

    // Deep moving water mass, kept translucent so the original UI remains legible.
    const waterX = -canvasWidth * .78 + canvasWidth * 1.45 * surge;
    const waterW = canvasWidth * .92;
    const grad = ctx.createLinearGradient(waterX, 0, waterX + waterW, 0);
    grad.addColorStop(0, rgba(c.water,0));
    grad.addColorStop(.45, rgba(c.water,.06*fade));
    grad.addColorStop(.78, rgba(c.glow,.13*fade));
    grad.addColorStop(1, rgba(c.foam,0));
    ctx.fillStyle = grad;
    ctx.fillRect(waterX, 0, waterW, canvasHeight);

    // Multiple physically-inspired wave fronts.
    for (let layer = 0; layer < 5; layer++) {
        const offset = t * (150 + layer*24) - layer*80;
        const baseY = canvasHeight * (.29 + layer*.115);
        const amp = 18 + layer*6;
        ctx.beginPath();
        for (let x = -40; x <= canvasWidth + 40; x += 12) {
            const y = baseY + Math.sin(x*.0105 + offset*.009) * amp + Math.sin(x*.025 - offset*.014) * 7;
            if (x === -40) ctx.moveTo(x,y); else ctx.lineTo(x,y);
        }
        ctx.strokeStyle = rgba(c.foam,(0.10 + layer*.035)*fade);
        ctx.lineWidth = 1.2 + layer*.5;
        ctx.shadowBlur = 12;
        ctx.shadowColor = rgba(c.glow,.30);
        ctx.stroke();
    }

    // Bright crest that sweeps across the viewport.
    const crestX = -canvasWidth*.18 + canvasWidth*1.32*easeOutCubic(clamp(t/3.0,0,1));
    ctx.beginPath();
    for (let y = -20; y <= canvasHeight + 20; y += 10) {
        const x = crestX + Math.sin(y*.015 + t*3.4)*18 + Math.sin(y*.047 - t*5)*8;
        if (y === -20) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.strokeStyle = rgba(c.crest,.36*fade);
    ctx.lineWidth = 2.2;
    ctx.shadowBlur = 20;
    ctx.shadowColor = rgba(c.glow,.72);
    ctx.stroke();

    // Foam / spray.
    particles.forEach(q => {
        q.x += q.vx * dt;
        q.y += q.vy * dt + Math.sin(q.x*.02 + t*4)*8*dt;
        if (q.x > canvasWidth + 40) q.x = -40;
        const local = clamp((q.x - crestX + 80) / 180, 0, 1);
        const a = q.alpha * Math.sin(Math.PI * local) * fade;
        if (a > 0) {
            ctx.fillStyle = rgba(c.foam,a);
            ctx.beginPath(); ctx.arc(q.x, q.y, q.size, 0, TAU); ctx.fill();
        }
    });

    // Radar-like wave propagation rings from the leading edge.
    rings.forEach(r => {
        r.age += dt;
        const k = clamp(r.age/r.life,0,1);
        const rr = r.maxRadius * easeOutCubic(k);
        ctx.beginPath();
        ctx.ellipse(r.x + rr*.22, r.y, rr, rr*.23, 0, 0, TAU);
        ctx.strokeStyle = rgba(c.glow,(1-k)*.13*fade);
        ctx.lineWidth = 1;
        ctx.stroke();
    });
    rings = rings.filter(r => r.age < r.life);
    ctx.restore();
    return p < 1;
}

function createFlood() {
    resetSimulationArrays();
    const count = Math.floor(canvasWidth / 24);
    for (let i = 0; i < count; i++) {
        rain.push({ x: seeded(i+10)*canvasWidth, y: seeded(i+20)*canvasHeight, speed: 480+seeded(i+30)*420, len: 7+seeded(i+40)*13, a: .04+seeded(i+50)*.10 });
    }
    for (let i = 0; i < 18; i++) {
        debris.push({ x: seeded(i+100)*canvasWidth, y: canvasHeight*(.78+seeded(i+110)*.22), vx: -10+seeded(i+120)*25, vy: -5+seeded(i+130)*10, rot: seeded(i+140)*TAU, spin: -1+seeded(i+150)*2, size: 4+seeded(i+160)*12 });
    }
}

function drawFlood(t, dt) {
    const ctx = disasterCtx;
    const c = disasterPalette("flood");
    const rise = easeOutCubic(clamp(t/4.8,0,1));
    const target = canvasHeight * (.98 - .72*rise);
    const fade = t > 4.7 ? 1-(t-4.7)/.8 : 1;

    ctx.save();
    ctx.globalCompositeOperation = "screen";

    // Atmospheric rain curtain.
    ctx.lineWidth = 1;
    rain.forEach(r => {
        r.y += r.speed * dt;
        if (r.y > canvasHeight + 20) r.y = -20;
        ctx.strokeStyle = rgba(c.rain,r.a*(.55+.45*rise));
        ctx.beginPath(); ctx.moveTo(r.x, r.y); ctx.lineTo(r.x-2, r.y+r.len); ctx.stroke();
    });

    // Rising water body with a luminous surface.
    const water = ctx.createLinearGradient(0,target,0,canvasHeight);
    water.addColorStop(0, rgba(c.water,.08*fade));
    water.addColorStop(.35, rgba(c.water,.13*fade));
    water.addColorStop(1, rgba(c.water,.19*fade));
    ctx.fillStyle = water;
    ctx.beginPath();
    ctx.moveTo(0, canvasHeight);
    for (let x=0;x<=canvasWidth;x+=10) {
        const y = target + Math.sin(x*.010 + t*2.4)*10 + Math.sin(x*.027-t*1.8)*4;
        ctx.lineTo(x,y);
    }
    ctx.lineTo(canvasWidth,canvasHeight); ctx.closePath(); ctx.fill();

    // Surface highlights and expanding ripples.
    ctx.beginPath();
    for (let x=0;x<=canvasWidth;x+=8) {
        const y = target + Math.sin(x*.011+t*2.4)*10 + Math.sin(x*.03-t)*4;
        if (x===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.strokeStyle = rgba(c.surface,.32*fade);
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 14;
    ctx.shadowColor = rgba(c.glow,.45);
    ctx.stroke();

    for (let i=0;i<7;i++) {
        const x = canvasWidth*(.10+i*.14) + Math.sin(t*.7+i)*55;
        const y = target + 20 + Math.sin(i*8.1+t*1.7)*10;
        const rr = 10 + ((t*38+i*23)%65);
        ctx.beginPath(); ctx.ellipse(x,y,rr,rr*.22,0,0,TAU);
        ctx.strokeStyle = rgba(c.surface,.12*fade);
        ctx.lineWidth=1; ctx.stroke();
    }

    // Floating debris sells scale and depth.
    debris.forEach(d => {
        d.x += d.vx*dt; d.y += d.vy*dt + Math.sin(t*1.7+d.x*.01)*2*dt; d.rot += d.spin*dt;
        if (d.x < -30) d.x = canvasWidth+30;
        if (d.x > canvasWidth+30) d.x = -30;
        ctx.save(); ctx.translate(d.x,d.y); ctx.rotate(d.rot);
        ctx.fillStyle = rgba(c.debris,.11*fade);
        ctx.fillRect(-d.size/2,-2,d.size,4);
        ctx.restore();
    });
    ctx.restore();
    return t < 5.5;
}

function createCyclone() {
    resetSimulationArrays();
    for (let i=0;i<650;i++) {
        const u = seeded(i+300);
        const v = seeded(i+700);
        windSeeds.push({ angle:u*TAU, radius:35+v*Math.min(canvasWidth,canvasHeight)*.54, speed:.55+seeded(i+900)*1.7, phase:seeded(i+1000)*TAU, size:.5+seeded(i+1100)*2.2 });
    }
}

function drawCyclone(t, dt) {
    const ctx=disasterCtx;
    const c=disasterPalette("cyclone");
    const p=clamp(t/5.5,0,1);
    const fade=t<.35?t/.35:t>4.7?1-(t-4.7)/.8:1;
    const cx=canvasWidth*.66 + Math.sin(t*.34)*25;
    const cy=canvasHeight*.48 + Math.cos(t*.27)*18;
    const maxR=Math.min(canvasWidth,canvasHeight)*.54;

    ctx.save(); ctx.globalCompositeOperation="screen";
    // Spiral particles with inward acceleration.
    windSeeds.forEach(w=>{
        const pull=Math.max(0,1-w.radius/maxR);
        w.angle += (w.speed*(.75+pull*2.6))*dt;
        w.radius -= (7+pull*22)*dt;
        if(w.radius<22) w.radius=maxR*(.68+seeded(Math.floor(w.phase*1000)+17)*.30);
        const spiral=w.angle + w.radius*.012;
        const x=cx+Math.cos(spiral)*w.radius;
        const y=cy+Math.sin(spiral)*w.radius*.68;
        const a=(.035+pull*.16)*(0.65+0.35*Math.sin(w.angle*2+w.phase))*fade;
        ctx.fillStyle=rgba(c.wind,Math.max(0,a));
        ctx.beginPath();ctx.arc(x,y,w.size,0,TAU);ctx.fill();
    });

    // Concentric pressure bands.
    for(let i=0;i<7;i++){
        const rr=(maxR*(.18+i*.115)) + Math.sin(t*1.2+i)*8;
        ctx.beginPath();
        ctx.ellipse(cx,cy,rr,rr*.68,-.13,0,TAU);
        ctx.strokeStyle=rgba(c.glow,(.035+i*.008)*fade);
        ctx.lineWidth=1.1; ctx.stroke();
    }
    // Eye of the storm.
    const eye=46+Math.sin(t*1.3)*5;
    const g=ctx.createRadialGradient(cx,cy,2,cx,cy,eye*2.8);
    g.addColorStop(0,rgba(c.eye,.18*fade));
    g.addColorStop(.3,rgba(c.glow,.07*fade));
    g.addColorStop(1,"rgba(60,170,230,0)");
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,eye*2.8,0,TAU);ctx.fill();
    ctx.strokeStyle=rgba(c.eye,.22*fade);ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(cx,cy,eye,0,TAU);ctx.stroke();
    ctx.restore();
    return p<1;
}

function makeCrack(x,y,len,ang,seedBase) {
    const pts=[{x,y}]; let px=x,py=y;
    const segments=5+Math.floor(seeded(seedBase)*4);
    for(let i=0;i<segments;i++){
        const step=len/segments*(.75+seeded(seedBase+i+2)*.45);
        const a=ang+(seeded(seedBase+i+20)-.5)*1.35;
        px+=Math.cos(a)*step; py+=Math.sin(a)*step;
        pts.push({x:px,y:py});
    }
    return {pts,age:0,life:4.5,branch:seeded(seedBase+50)>.45};
}

function createEarthquake() {
    resetSimulationArrays();
    cracks=[
        makeCrack(canvasWidth*.16,canvasHeight*.16,180,.8,20),
        makeCrack(canvasWidth*.79,canvasHeight*.12,230,2.1,70),
        makeCrack(canvasWidth*.47,canvasHeight*.92,260,-1.15,130),
        makeCrack(canvasWidth*.88,canvasHeight*.72,190,2.55,190),
        makeCrack(canvasWidth*.58,canvasHeight*.42,170,-.4,250)
    ];
    for(let i=0;i<22;i++) particles.push({x:seeded(i+500)*canvasWidth,y:seeded(i+600)*canvasHeight,vx:-35+seeded(i+700)*70,vy:20+seeded(i+800)*75,size:1+seeded(i+900)*3,a:.04+seeded(i+1000)*.10});
}

function drawEarthquake(t,dt) {
    const ctx=disasterCtx;
    const c=disasterPalette("earthquake");
    const fade=t>3.9?1-(t-3.9)/.9:1;
    const shake=clamp(1-t/1.05,0,1);
    const sx=(Math.sin(t*64)+Math.sin(t*37)*.55)*7*shake;
    const sy=(Math.cos(t*58)+Math.sin(t*43)*.4)*5*shake;
    ctx.save(); ctx.translate(sx,sy); ctx.globalCompositeOperation="screen";

    // Seismic shockwave rings.
    if(t<2.4 && rings.length<12 && Math.random()<.07) spawnRing(canvasWidth*.5+(Math.random()-.5)*140,canvasHeight*.52+(Math.random()-.5)*100,100+Math.random()*260,1.5+Math.random(),"seismic");
    rings.forEach(r=>{
        r.age+=dt; const k=clamp(r.age/r.life,0,1); const rr=r.maxRadius*easeOutCubic(k);
        ctx.beginPath();ctx.arc(r.x,r.y,rr,0,TAU);
        ctx.strokeStyle=rgba(c.shock,(1-k)*.20*fade);ctx.lineWidth=1.2;ctx.stroke();
    });
    rings=rings.filter(r=>r.age<r.life);

    // Cracks draw on like a HUD fault map.
    cracks.forEach((c,idx)=>{
        c.age+=dt;
        const progress=easeOutCubic(clamp((t-idx*.09)/.65,0,1));
        const n=Math.max(2,Math.floor((c.pts.length-1)*progress)+1);
        ctx.beginPath();
        c.pts.slice(0,n).forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));
        ctx.strokeStyle=rgba(c.crack,.42*fade);
        ctx.lineWidth=1.3;ctx.shadowBlur=12;ctx.shadowColor=rgba(c.shock,.48);ctx.stroke();
        ctx.strokeStyle=rgba(c.crack,.11*fade);ctx.lineWidth=3;ctx.stroke();
    });

    particles.forEach(q=>{
        q.x+=q.vx*dt;q.y+=q.vy*dt;
        if(q.y>canvasHeight) q.y=-5;
        ctx.fillStyle=rgba(c.dust,q.a*fade);
        ctx.beginPath();ctx.arc(q.x,q.y,q.size,0,TAU);ctx.fill();
    });
    ctx.restore();
    return t<5.0;
}

function clearDisasterEffects() {
    effectRunToken++;
    activeDisaster=null;
    resetSimulationArrays();
    clearCanvas();
    disasterEffectElements.forEach(effect=>{
        if(!effect)return;
        effect.classList.remove("active");
        void effect.offsetWidth;
    });
    document.body.classList.remove("earthquake-shake");
}

function playDisasterEffect(type) {
    clearDisasterEffects();
    const token=effectRunToken;
    activeDisaster=type;
    disasterStart=performance.now();
    lastFrame=disasterStart;

    if(type==="tsunami") { createTsunami(); tsunamiEffect?.classList.add("active"); }
    if(type==="flood") { createFlood(); floodEffect?.classList.add("active"); }
    if(type==="cyclone") { createCyclone(); cycloneEffect?.classList.add("active"); }
    if(type==="earthquake") {
        createEarthquake(); earthquakeEffect?.classList.add("active");
        document.body.classList.add("earthquake-shake");
        window.setTimeout(()=>document.body.classList.remove("earthquake-shake"),900);
    }

    void disasterCanvas?.offsetWidth;
    if (disasterFrame) cancelAnimationFrame(disasterFrame);
    disasterFrame=requestAnimationFrame(renderDisaster);

    window.setTimeout(()=>{
        if(token===effectRunToken) clearDisasterEffects();
    },6200);
}

function renderDisaster(now) {
    if(!activeDisaster || !disasterCtx) return;
    const dt=Math.min((now-lastFrame)/1000,.035);
    lastFrame=now;
    const t=(now-disasterStart)/1000;
    clearCanvas();

    let alive=false;
    if(activeDisaster==="tsunami") alive=drawTsunami(t,dt);
    if(activeDisaster==="flood") alive=drawFlood(t,dt);
    if(activeDisaster==="cyclone") alive=drawCyclone(t,dt);
    if(activeDisaster==="earthquake") alive=drawEarthquake(t,dt);

    if(alive && activeDisaster) disasterFrame=requestAnimationFrame(renderDisaster);
    else clearCanvas();
}

resizeDisasterCanvas();
window.addEventListener("resize", resizeDisasterCanvas, { passive: true });

/* Change scenario -> launch the cinematic visualization. */
disasterSelect.addEventListener("change", () => {
    playDisasterEffect(disasterSelect.value);
    validateDisasterCompatibility();
});

disasterSelect.addEventListener("mousedown", () => {
    disasterBeforeOpen = disasterSelect.value;
});

disasterSelect.addEventListener("click", () => {
    window.setTimeout(() => {
        if (disasterSelect.value === disasterBeforeOpen) playDisasterEffect(disasterSelect.value);
    }, 90);
});

disasterSelect.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
        window.setTimeout(() => playDisasterEffect(disasterSelect.value), 0);
    }
});



/* ============================================================
   THEME SWITCHER
============================================================ */
const themeToggle = document.getElementById("themeToggle");
const savedTheme = localStorage.getItem("resq-theme");
if (savedTheme === "light") document.body.classList.add("light-mode");

function syncThemeIcon() {
    if (!themeToggle) return;
    const light = document.body.classList.contains("light-mode");
    themeToggle.setAttribute("aria-label", light ? "Switch to dark mode" : "Switch to light mode");
    themeToggle.setAttribute("title", light ? "Switch to dark mode" : "Switch to light mode");
}

themeToggle?.addEventListener("click", () => {
    document.body.classList.toggle("light-mode");
    localStorage.setItem("resq-theme", document.body.classList.contains("light-mode") ? "light" : "dark");
    syncThemeIcon();
});
syncThemeIcon();
