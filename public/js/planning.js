// 🥾 Planification de randonnée

function getCurrentLocationForPlanning(inputType) {
    if (!navigator.geolocation) {
        showToast('Géolocalisation non supportée', 'error');
        return;
    }

    showLoading('Localisation en cours...');

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            hideLoading();
            const {latitude, longitude} = position.coords;
            
            try {
                // Géocodage inverse avec OpenRouteService
                const response = await fetch(
                    `${ORS_BASE_URL}/geocode/reverse?api_key=${ORS_API_KEY}&point.lon=${longitude}&point.lat=${latitude}&size=1`,
                    {
                        method: 'GET',
                        headers: { 'Accept': 'application/json' }
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    if (data.features && data.features.length > 0) {
                        const address = data.features[0].properties.label;
                        document.getElementById(`${inputType}-point`).value = address;
                        showToast('Position obtenue !', 'success');
                        return;
                    }
                }
                
                // Fallback
                const locationName = `Position actuelle (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
                document.getElementById(`${inputType}-point`).value = locationName;
                showToast('Position obtenue !', 'success');
                
            } catch (error) {
                console.error('Erreur géocodage inverse:', error);
                const locationName = `Position actuelle (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
                document.getElementById(`${inputType}-point`).value = locationName;
                showToast('Position obtenue !', 'success');
            }
        },
        (error) => {
            hideLoading();
            console.error('Erreur géolocalisation:', error);
            showToast('Impossible d\'obtenir la position', 'error');
        },
        {
            enableHighAccuracy: true,
            timeout: 10000
        }
    );
}

async function getPopularDestinations() {
    // Destinations populaires pré-définies
    const destinations = [
        'Mont Blanc, Chamonix',
        'Pic du Midi, Pyrénées',
        'Cirque de Gavarnie',
        'Gorges du Verdon',
        'Calanques de Marseille',
        'Vosges - Ballon d\'Alsace'
    ];
    
    const randomDestination = destinations[Math.floor(Math.random() * destinations.length)];
    document.getElementById('end-point').value = randomDestination;
    showToast('Destination suggérée !', 'info');
}

async function planCustomHike() {
    const startPoint = document.getElementById('start-point').value.trim();
    const endPoint = document.getElementById('end-point').value.trim();
    const difficulty = document.getElementById('preferred-difficulty').value;
    const maxDistance = document.getElementById('max-distance').value;

    if (!startPoint || !endPoint) {
        showToast('Veuillez renseigner le départ et l\'arrivée', 'error');
        return;
    }

    showLoading('Planification de votre randonnée...');

    try {
        // Géocoder les points
        const startCoords = await geocodeAddress(startPoint);
        const endCoords = await geocodeAddress(endPoint);

        if (!startCoords || !endCoords) {
            throw new Error('Impossible de localiser une des adresses');
        }

        // Planifier avec l'API backend
        const response = await fetch(`${API_BASE}/trails/plan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                start: startCoords,
                end: endCoords,
                difficulty,
                maxDistance: maxDistance ? parseFloat(maxDistance) : null
            })
        });

        const result = await response.json();
        hideLoading();

        if (result.success) {
            currentTrail = result.data;
            displayPlannedHike(result.data);
            showToast('Randonnée planifiée avec succès !', 'success');
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        hideLoading();
        console.error('Erreur planification:', error);
        showToast('Erreur lors de la planification : ' + error.message, 'error');
    }
}

async function geocodeAddress(address) {
    try {
        const response = await fetch(
            `${ORS_BASE_URL}/geocode/search?api_key=${ORS_API_KEY}&text=${encodeURIComponent(address)}&size=1`,
            {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            }
        );

        if (!response.ok) {
            throw new Error(`Erreur géocodage: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
            const coords = data.features[0].geometry.coordinates;
            return {
                lng: coords[0],
                lat: coords[1],
                name: data.features[0].properties.label
            };
        }
        
        return null;
    } catch (error) {
        console.error('Erreur géocodage:', error);
        return null;
    }
}

function displayPlannedHike(hike) {
    const resultDiv = document.getElementById('planned-hike-result');
    
    resultDiv.innerHTML = `
        <div class="planned-hike-card">
            <h3><i class="fas fa-route"></i> Votre randonnée personnalisée</h3>
            <div class="hike-summary">
                <div class="summary-stats">
                    <div class="summary-stat">
                        <i class="fas fa-route"></i>
                        <span>${hike.distance}</span>
                    </div>
                    <div class="summary-stat">
                        <i class="fas fa-clock"></i>
                        <span>${hike.duration}</span>
                    </div>
                    <div class="summary-stat">
                        <i class="fas fa-mountain"></i>
                        <span>${hike.elevation}</span>
                    </div>
                    <div class="summary-stat difficulty-${hike.difficulty}">
                        <i class="fas fa-signal"></i>
                        <span>${getDifficultyText(hike.difficulty)}</span>
                    </div>
                </div>
                <div class="weather-info">
                    <i class="fas fa-${getWeatherIcon(hike.weather)}"></i>
                    <span>Météo: ${getWeatherText(hike.weather)}</span>
                </div>
            </div>
            
            <div class="hike-tips">
                <h4><i class="fas fa-lightbulb"></i> Conseils pour votre randonnée</h4>
                <ul>
                    ${hike.tips.map(tip => `<li>${tip}</li>`).join('')}
                </ul>
            </div>
            
            <div class="hike-actions">
                <button class="start-planned-hike-btn" onclick="startPlannedHike()">
                    <i class="fas fa-play"></i>
                    Commencer cette randonnée
                </button>
                <button class="save-planned-hike-btn" onclick="savePlannedHike()">
                    <i class="fas fa-bookmark"></i>
                    Sauvegarder
                </button>
            </div>
        </div>
    `;
    
    resultDiv.classList.remove('hidden');
    
    // Afficher sur la carte
    displayHikeRouteOnMap(hike);
}

function getWeatherIcon(weather) {
    switch(weather) {
        case 'sunny': return 'sun';
        case 'cloudy': return 'cloud';
        case 'rainy': return 'cloud-rain';
        case 'snowy': return 'snowflake';
        default: return 'cloud-sun';
    }
}

function getWeatherText(weather) {
    switch(weather) {
        case 'sunny': return 'Ensoleillé ☀️';
        case 'cloudy': return 'Nuageux ☁️';
        case 'rainy': return 'Pluvieux 🌧️';
        case 'snowy': return 'Neigeux ❄️';
        default: return 'Variable 🌤️';
    }
}

function displayHikeRouteOnMap(hike) {
    if (!map || !hike.waypoints) return;

    // Nettoyer les routes précédentes
    routeLayer.clearLayers();

    // Créer la ligne de route
    const routeCoordinates = hike.waypoints.map(point => [point.lat, point.lng]);
    
    const routeLine = L.polyline(routeCoordinates, {
        color: getDifficultyColor(hike.difficulty),
        weight: 6,
        opacity: 0.9,
        smoothFactor: 1,
        className: 'hike-route-line'
    });

    // Contour blanc pour meilleure visibilité
    const routeOutline = L.polyline(routeCoordinates, {
        color: 'white',
        weight: 8,
        opacity: 0.8,
        smoothFactor: 1
    });

    routeLayer.addLayer(routeOutline);
    routeLayer.addLayer(routeLine);

    // Marqueurs de départ et d'arrivée
    const startIcon = L.divIcon({
        html: `
            <div class="trail-marker start">
                <i class="fas fa-play"></i>
            </div>
        `,
        iconSize: [32, 32],
        className: 'trail-marker-icon'
    });

    const endIcon = L.divIcon({
        html: `
            <div class="trail-marker end">
                <i class="fas fa-flag-checkered"></i>
            </div>
        `,
        iconSize: [32, 32],
        className: 'trail-marker-icon'
    });

    L.marker([hike.start.lat, hike.start.lng], {icon: startIcon})
        .addTo(routeLayer)
        .bindPopup(`
            <div class="custom-popup">
                <div class="popup-header">
                    <i class="fas fa-play"></i>
                    Départ
                </div>
                <div class="popup-content">
                    <h4>Point de départ</h4>
                    <p>${hike.start.name || 'Position de départ'}</p>
                </div>
            </div>
        `);

    L.marker([hike.end.lat, hike.end.lng], {icon: endIcon})
        .addTo(routeLayer)
        .bindPopup(`
            <div class="custom-popup">
                <div class="popup-header">
                    <i class="fas fa-flag-checkered"></i>
                    Arrivée
                </div>
                <div class="popup-content">
                    <h4>Destination</h4>
                    <p>${hike.end.name || 'Point d\'arrivée'}</p>
                </div>
            </div>
        `);

    // Ajuster la vue
    const bounds = L.latLngBounds(routeCoordinates);
    map.fitBounds(bounds, {padding: [50, 50]});
}

function savePlannedHike() {
    saveTrail(); // Même logique
}