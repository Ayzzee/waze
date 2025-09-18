// 🥾 Planification de randonnée


// Fonction pour décoder une polyline encodée
function decodePolyline(encoded) {
    if (!encoded) return [];
    
    let points = [];
    let index = 0, lat = 0, lng = 0;
    
    while (index < encoded.length) {
        let b, shift = 0, result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        
        let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lat += dlat;
        
        shift = 0;
        result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        
        let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lng += dlng;
        
        points.push([lng / 1e5, lat / 1e5]);
    }
    
    return points;
}

const frenchCities = [
    "Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Strasbourg", "Montpellier", "Bordeaux", "Lille",
    "Rennes", "Reims", "Le Havre", "Saint-Étienne", "Toulon", "Grenoble", "Dijon", "Angers", "Nîmes", "Villeurbanne"
];

// Initialiser l'autocomplete sur les champs de planification
function initializePlanningSuggestions() {
    const startInput = document.getElementById('start-point');
    const endInput = document.getElementById('end-point');
    
    if (startInput) {
        setupAutocomplete(startInput, 'start-suggestions');
    }
    if (endInput) {
        setupAutocomplete(endInput, 'end-suggestions');
    }
}

function setupAutocomplete(input, suggestionId) {
    // Créer le conteneur de suggestions
    const suggestionsContainer = document.createElement('div');
    suggestionsContainer.id = suggestionId;
    suggestionsContainer.className = 'suggestions-container hidden';
    input.parentNode.appendChild(suggestionsContainer);
    
    input.addEventListener('input', async function() {
        const query = this.value.trim();
        if (query.length < 2) {
            hideSuggestions(suggestionId);
            return;
        }
        // Appel à l'API OpenRouteService Autocomplete
        try {
            const response = await fetch(
                `${ORS_BASE_URL}/geocode/autocomplete?api_key=${ORS_API_KEY}&text=${encodeURIComponent(query)}&boundary.country=FR&size=5`,
                {
                    method: 'GET',
                    headers: { 'Accept': 'application/json' }
                }
            );
            if (response.ok) {
                const data = await response.json();
                const suggestions = (data.features || []).map(f => ({
                    label: f.properties.label,
                    coords: f.geometry.coordinates
                }));
                displaySuggestionsORS(suggestions, suggestionId, input);
            } else {
                hideSuggestions(suggestionId);
            }
        } catch (e) {
            console.error('Erreur autocomplete ORS:', e);
            hideSuggestions(suggestionId);
        }
    });
    
    input.addEventListener('blur', function() {
        // Délai pour permettre le clic sur les suggestions
        setTimeout(() => hideSuggestions(suggestionId), 200);
    });
}

function displaySuggestions(cities, containerId, input) {
    // ...existing code...
}

// Nouvelle fonction pour suggestions ORS
function displaySuggestionsORS(suggestions, containerId, input) {
    const container = document.getElementById(containerId);
    if (!suggestions || suggestions.length === 0) {
        hideSuggestions(containerId);
        return;
    }
    container.innerHTML = suggestions.map(s => `
        <div class="suggestion-item" onclick="selectSuggestionORS('${s.label.replace(/'/g, "&#39;")}', '${input.id}', '${containerId}', ${s.coords[1]}, ${s.coords[0]})">
            <i class="fas fa-map-marker-alt"></i>
            <span>${s.label}</span>
        </div>
    `).join('');
    container.classList.remove('hidden');
}

function selectSuggestionORS(label, inputId, containerId, lat, lng) {
    document.getElementById(inputId).value = label;
    document.getElementById(inputId).dataset.lat = lat;
    document.getElementById(inputId).dataset.lng = lng;
    hideSuggestions(containerId);
}

function selectSuggestion(city, inputId, containerId) {
    document.getElementById(inputId).value = city;
    hideSuggestions(containerId);
}

function hideSuggestions(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.classList.add('hidden');
    }
}

function getCurrentLocationForPlanning(inputType) {
    if (!navigator.geolocation) {
        // Désactiver les notifications toast
        // showToast('Géolocalisation non supportée', 'error');
        return;
    }

    showLoading('Localisation en cours...');

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            hideLoading();
            const {latitude, longitude} = position.coords;
            
            // Ajouter un marqueur sur la carte pour la position actuelle
            if (window.map) {
                console.log('🗺️ Map disponible, ajout du marqueur de position');
                // Supprimer l'ancien marqueur s'il existe
                if (window.userLocationMarker) {
                    map.removeLayer(window.userLocationMarker);
                    console.log('📍 Ancien marqueur supprimé');
                }
                if (window.userLocationIconMarker) {
                    map.removeLayer(window.userLocationIconMarker);
                }
                
                // Créer seulement le cercle bleu pour la position utilisateur
                window.userLocationMarker = L.circle([latitude, longitude], {
                    radius: 25, // Augmenter le rayon pour plus de visibilité
                    color: '#2563eb',
                    fillColor: '#3b82f6',
                    fillOpacity: 0.8, // Légèrement plus transparent
                    weight: 5 // Épaisseur du contour augmentée
                }).addTo(map).bindPopup('Votre position actuelle');
                
                console.log('🔵 Cercle bleu ajouté à la position:', latitude, longitude);
                
                // Centrer la carte sur la position
                map.setView([latitude, longitude], 15);
                
                // Mettre à jour la variable globale userLocation
                window.userLocation = {
                    lat: latitude,
                    lng: longitude
                };
            } else {
                console.error('❌ Map non disponible, impossible d\'ajouter le marqueur');
            }
            
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

    showLoading('Planification de votre randonnée sur les sentiers...');

    try {
        // Géocoder les points
        console.log('🔍 Géocodage de:', startPoint, 'vers', endPoint);
        const startCoords = await geocodeAddress(startPoint);
        const endCoords = await geocodeAddress(endPoint);

        console.log('📍 Coordonnées trouvées:', { startCoords, endCoords });

        if (!startCoords || !endCoords) {
            throw new Error('Impossible de localiser une des adresses');
        }

        // Planifier avec routing spécialisé randonnée
        const hikeRoute = await planHikingRoute(startCoords, endCoords, difficulty, maxDistance);
        
        if (hikeRoute) {
            currentTrail = hikeRoute;
            displayPlannedHike(hikeRoute);
            showToast('Randonnée planifiée sur les sentiers !', 'success');
        } else {
            throw new Error('Aucun sentier trouvé pour cet itinéraire');
        }
    } catch (error) {
        hideLoading();
        console.error('Erreur planification:', error);
        showToast('Erreur lors de la planification : ' + error.message, 'error');
    }
}

async function planHikingRoute(startCoords, endCoords, difficulty, maxDistance) {
    try {
        console.log('🚶 Calcul d\'itinéraire de', startCoords, 'vers', endCoords);
        
        // Utiliser OpenRouteService avec le profil foot-walking (plus fiable que foot-hiking)
        const requestBody = {
            coordinates: [
                [startCoords.lng, startCoords.lat],
                [endCoords.lng, endCoords.lat]
            ],
            format: 'geojson',
            instructions: false,
            preference: 'recommended'
        };
        
        console.log('📤 Requête ORS:', requestBody);
        
        const routeResponse = await fetch(`${ORS_BASE_URL}/v2/directions/foot-walking`, {
            method: 'POST',
            headers: {
                'Authorization': ORS_API_KEY,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        console.log('📥 Réponse ORS:', routeResponse.status);

        if (!routeResponse.ok) {
            const errorText = await routeResponse.text();
            console.error('❌ Erreur ORS:', routeResponse.status, errorText);
            throw new Error('Impossible de calculer l\'itinéraire de randonnée');
        }

        const routeData = await routeResponse.json();
        console.log('✅ Données route reçues:', routeData);
        
        // OpenRouteService retourne les données dans routeData.routes ou routeData.features
        let route;
        if (routeData.routes && routeData.routes.length > 0) {
            // Format standard ORS
            route = routeData.routes[0];
            console.log('📊 Route trouvée (format routes):', route);
        } else if (routeData.features && routeData.features.length > 0) {
            // Format GeoJSON
            route = routeData.features[0];
            console.log('📊 Route trouvée (format features):', route);
        } else {
            console.warn('⚠️ Aucune route trouvée dans la réponse ORS');
            throw new Error('Aucun sentier trouvé pour cet itinéraire');
        }

        // Adapter selon le format de la réponse
        let coordinates, properties;
        if (route.geometry) {
            // Format GeoJSON ou ORS avec geometry
            if (typeof route.geometry === 'string') {
                // Géométrie encodée (polyline) - à décoder
                console.log('🔤 Géométrie encodée détectée');
                coordinates = decodePolyline(route.geometry);
            } else {
                coordinates = route.geometry.coordinates || route.geometry;
            }
            properties = route.summary || route.properties || {};
        } else if (route.coordinates) {
            // Format avec coordonnées directes
            coordinates = route.coordinates;
            properties = route.summary || route.properties || {};
        } else {
            throw new Error('Format de route non reconnu');
        }
        
        console.log('🗺️ Coordonnées extraites:', coordinates?.length, 'points');
        console.log('📈 Propriétés:', properties);
        
        
        // Convertir les coordonnées en waypoints
        const waypoints = coordinates.map(coord => ({
            lat: coord[1],
            lng: coord[0]
        }));

        const hikeRoute = {
            id: Date.now(),
            start: startCoords,
            end: endCoords,
            distance: `${((properties.distance || 0) / 1000).toFixed(1)} km`,
            duration: `${Math.round((properties.duration || 3600) / 3600)}h ${Math.round(((properties.duration || 3600) % 3600) / 60)}min`,
            elevation: `+${Math.round(properties.ascent || 0)}m`,
            difficulty: difficulty || 'moderate',
            terrain: 'sentier de randonnée',
            rating: (Math.random() * 2 + 3).toFixed(1),
            waypoints: waypoints,
            weather: ['sunny', 'cloudy', 'partly-cloudy'][Math.floor(Math.random() * 3)],
            tips: [
                'Suivez les balisages sur le sentier',
                'Emportez suffisamment d\'eau',
                'Vérifiez la météo avant de partir',
                'Prévenez quelqu\'un de votre itinéraire'
            ],
            trailType: 'hiking',
            followsTrails: true,
            routeGeometry: { coordinates } // Géométrie complète du sentier
        };
        
        hideLoading();
        return hikeRoute;
        
    } catch (error) {
        console.error('Erreur API OpenRouteService:', error);
        
        // Fallback : générer un itinéraire approximatif
        const distance = calculateDistance(startCoords, endCoords);
        const elevationGain = Math.floor(Math.random() * 800 + 200);
        const estimatedTime = calculateHikingTime(distance, elevationGain);
        
        // Générer des points intermédiaires qui simulent un sentier
        const waypoints = generateHikingWaypoints(startCoords, endCoords, difficulty);
        
        const hikeRoute = {
            id: Date.now(),
            start: startCoords,
            end: endCoords,
            distance: `${distance.toFixed(1)} km`,
            duration: estimatedTime,
            elevation: `+${elevationGain}m`,
            difficulty: difficulty || 'moderate',
            terrain: 'sentier approximatif',
            rating: (Math.random() * 2 + 3).toFixed(1),
            waypoints: waypoints,
            weather: ['sunny', 'cloudy', 'partly-cloudy'][Math.floor(Math.random() * 3)],
            tips: [
                'Itinéraire approximatif - vérifiez sur place',
                'Emportez suffisamment d\'eau',
                'Vérifiez la météo avant de partir'
            ],
            trailType: 'approximate',
            followsTrails: false
        };
        
        hideLoading();
        return hikeRoute;
    }
}

function generateHikingWaypoints(start, end, difficulty) {
    const waypoints = [start];
    
    // Générer des points intermédiaires qui simulent un sentier sinueux
    const numPoints = difficulty === 'hard' ? 6 : difficulty === 'moderate' ? 4 : 3;
    
    for (let i = 1; i < numPoints; i++) {
        const progress = i / numPoints;
        const lat = start.lat + (end.lat - start.lat) * progress + (Math.random() - 0.5) * 0.01;
        const lng = start.lng + (end.lng - start.lng) * progress + (Math.random() - 0.5) * 0.01;
        
        waypoints.push({
            lat,
            lng,
            name: `Point de passage ${i}`,
            type: 'waypoint',
            trailMarker: true
        });
    }
    
    waypoints.push(end);
    return waypoints;
}

function calculateDistance(start, end) {
    // Calcul de distance plus réaliste pour randonnée (avec détours de sentiers)
    const directDistance = getDirectDistance(start, end);
    // Les sentiers sont généralement 1.3 à 1.8 fois plus longs que la ligne droite
    const trailMultiplier = 1.3 + Math.random() * 0.5;
    return directDistance * trailMultiplier;
}

function getDirectDistance(start, end) {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (end.lat - start.lat) * Math.PI / 180;
    const dLng = (end.lng - start.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(start.lat * Math.PI / 180) * Math.cos(end.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function calculateHikingTime(distance, elevation) {
    // Calcul temps de marche selon la règle de Naismith
    const baseTime = distance / 4; // 4 km/h en terrain plat
    const elevationTime = elevation / 600; // 600m/h de montée
    const totalHours = baseTime + elevationTime;
    
    const hours = Math.floor(totalHours);
    const minutes = Math.floor((totalHours - hours) * 60);
    
    return hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
}
// The following block appears to be misplaced and should be removed to fix the syntax error.
// If this code is needed, ensure it is inside a function.

async function geocodeAddress(address) {
    try {
        console.log('🌍 Géocodage de:', address);
        
        const response = await fetch(
            `${ORS_BASE_URL}/geocode/search?api_key=${ORS_API_KEY}&text=${encodeURIComponent(address)}&size=1&boundary.country=FR`,
            {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            }
        );

        if (!response.ok) {
            console.error('❌ Erreur géocodage HTTP:', response.status);
            throw new Error(`Erreur géocodage: ${response.status}`);
        }

        const data = await response.json();
        console.log('📍 Résultat géocodage:', data);
        
        if (data.features && data.features.length > 0) {
            const coords = data.features[0].geometry.coordinates;
            const result = {
                lng: coords[0],
                lat: coords[1],
                name: data.features[0].properties.label
            };
            console.log('✅ Coordonnées trouvées:', result);
            return result;
        }
        
        console.warn('⚠️ Aucune coordonnée trouvée pour:', address);
        return null;
    } catch (error) {
        console.error('❌ Erreur géocodage:', error);
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