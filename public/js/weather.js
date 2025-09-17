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
    
    weatherIcon.className = `weather-icon fas fa-${getWeatherIcon(current.condition)}`;
    weatherTemp.textContent = current.temperature;
    
    // Mettre à jour les détails
    document.getElementById('visibility').textContent = current.visibility;
    document.getElementById('wind-speed').textContent = current.wind;
    document.getElementById('humidity').textContent = current.humidity;
    
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