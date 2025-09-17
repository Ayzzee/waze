// 🌤️ Météo

async function checkWeather() {
    if (!userLocation) {
        showToast('Position requise pour la météo', 'warning');
        return;
    }

    showLoading('Chargement de la météo...');

    try {
        const response = await fetch(`${API_BASE}/weather/${userLocation.lat}/${userLocation.lng}`);
        const result = await response.json();

        hideLoading();

        if (result.success) {
            displayWeatherWidget(result.data);
        } else {
            showToast('Erreur chargement météo', 'error');
        }
    } catch (error) {
        hideLoading();
        console.error('Erreur météo:', error);
        showToast('Erreur lors du chargement de la météo', 'error');
    }
}

function displayWeatherWidget(weatherData) {
    const widget = document.getElementById('weather-widget');
    const current = weatherData.current;
    
    // Mettre à jour l'icône selon les conditions
    const weatherIcon = document.querySelector('.weather-icon');
    const weatherTemp = document.querySelector('.weather-temp');
    const weatherCondition = document.querySelector('.weather-condition');
    
    weatherIcon.className = `weather-icon fas fa-${getWeatherIcon(current.condition)}`;
    weatherTemp.textContent = current.temperature;
    weatherCondition.textContent = getWeatherText(current.condition);
    
    // Mettre à jour les détails
    document.getElementById('visibility').textContent = current.visibility;
    document.getElementById('wind-speed').textContent = current.wind;
    document.getElementById('humidity').textContent = current.humidity;
    document.getElementById('feels-like').textContent = current.feelsLike || current.temperature;
    
    // Conseils pour la randonnée
    const advice = getHikingAdvice(current);
    document.getElementById('hiking-advice').textContent = advice;
    
    // Prévisions des prochaines heures
    const forecastContainer = document.getElementById('forecast-items');
    forecastContainer.innerHTML = '';
    
    if (weatherData.forecast) {
        weatherData.forecast.slice(0, 4).forEach((item, index) => {
            const time = index === 0 ? 'Maintenant' : `+${(index + 1) * 3}h`;
            const forecastItem = document.createElement('div');
            forecastItem.className = 'forecast-item';
            forecastItem.innerHTML = `
                <div>${time}</div>
                <i class="fas fa-${getWeatherIcon(item.condition)}"></i>
                <div>${item.temp_max}</div>
                <div>${item.precipitation}</div>
            `;
            forecastContainer.appendChild(forecastItem);
        });
    }
    
    // Afficher le widget
    widget.classList.remove('hidden');
    
    // Alertes météo
    if (weatherData.alerts && weatherData.alerts.length > 0) {
        setTimeout(() => {
            weatherData.alerts.forEach(alert => {
                showToast(alert, 'warning');
            });
        }, 1000);
    }
}

function getHikingAdvice(current) {
    const temp = parseInt(current.temperature);
    const wind = parseInt(current.wind);
    const humidity = parseInt(current.humidity);
    const condition = current.condition;
    
    if (condition === 'rainy') {
        return '⚠️ Risque de pluie - Prévoyez un équipement imperméable';
    } else if (condition === 'snowy') {
        return '❄️ Conditions hivernales - Équipement spécialisé requis';
    } else if (temp < 5) {
        return '🧥 Températures froides - Habillez-vous chaudement';
    } else if (temp > 25 && humidity > 70) {
        return '💧 Chaleur et humidité - Hydratez-vous bien';
    } else if (wind > 25) {
        return '💨 Vent fort - Attention aux passages exposés';
    } else if (temp >= 15 && temp <= 25 && condition === 'sunny') {
        return '✅ Conditions parfaites pour la randonnée';
    } else {
        return '👍 Bonnes conditions générales pour randonner';
    }
}

function closeWeatherWidget() {
    document.getElementById('weather-widget').classList.add('hidden');
}

function toggleWeatherLayer() {
    if (map.hasLayer(weatherLayer)) {
        map.removeLayer(weatherLayer);
        showToast('Couche météo masquée', 'info');
    } else {
        map.addLayer(weatherLayer);
        loadWeatherLayer();
        showToast('Couche météo affichée', 'success');
    }
}

function loadWeatherLayer() {
    // Simulation d'overlay météo
    weatherLayer.clearLayers();
    
    if (!userLocation) return;
    
    // Ajouter des zones météo simulées
    const weatherZones = [
        {
            center: [userLocation.lat + 0.05, userLocation.lng + 0.05],
            radius: 5000,
            weather: 'sunny',
            color: '#f59e0b'
        },
        {
            center: [userLocation.lat - 0.03, userLocation.lng - 0.02],
            radius: 3000,
            weather: 'cloudy',
            color: '#6b7280'
        }
    ];
    
    weatherZones.forEach(zone => {
        L.circle(zone.center, {
            radius: zone.radius,
            color: zone.color,
            fillColor: zone.color,
            fillOpacity: 0.2,
            weight: 2
        }).addTo(weatherLayer);
    });
}