// Configuration OpenRouteService avec ta clé
const ORS_API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjdlMDg1MzQyOGEzYTQ3ZWY5YjJiMjgzNGYxNmFlNDhjIiwiaCI6Im11cm11cjY0In0=';
const ORS_BASE_URL = 'https://api.openrouteservice.org';
const API_BASE = 'http://localhost:3000/api';

// Variables globales HiKe
let map;
let currentTrail = null;
let currentHiker = null;
let activeHike = false;
let userLocation = null;
let routeLayer = null;
let markersLayer = null;
let discoveryLayer = null;
let weatherLayer = null;
let selectedDiscoveryType = null;
let mapStyle = 'outdoor';
let hikeStartTime = null;
let hikeTimer = null;

// Types de découvertes avec couleurs
const discoveryTypes = {
    wildlife: { icon: 'fas fa-paw', color: '#10b981', name: 'Faune' },
    viewpoint: { icon: 'fas fa-binoculars', color: '#0ea5e9', name: 'Point de vue' },
    waterfall: { icon: 'fas fa-tint', color: '#06b6d4', name: 'Cascade' },
    cave: { icon: 'fas fa-mountain', color: '#6b7280', name: 'Grotte' },
    flora: { icon: 'fas fa-leaf', color: '#22c55e', name: 'Flore' },
    danger: { icon: 'fas fa-exclamation-triangle', color: '#ef4444', name: 'Danger' }
};

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', function() {
    console.log('🥾 Initialisation de HiKe - Votre compagnon de randonnée');
    initializeApp();
    initializeMap();
    loadInitialData();
    setupLocationTracking();
});

function initializeApp() {
    setupEventListeners();
    loadHikerProfile();
    
    // Vérifier le support PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('🔧 Service Worker enregistré'))
            .catch(err => console.log('❌ Erreur Service Worker:', err));
    }
}

function setupEventListeners() {
    // Gestion des clics globaux
    document.addEventListener('click', handleGlobalClick);
    document.addEventListener('keydown', handleKeyDown);
    
    // Événements de géolocalisation
    if ('geolocation' in navigator) {
        navigator.geolocation.watchPosition(
            updateUserLocation,
            handleLocationError,
            {
                enableHighAccuracy: true,
                timeout: 30000,
                maximumAge: 60000
            }
        );
    }
    
    // Gestion des notifications push
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

function handleGlobalClick(e) {
    // Fermer les sheets si clic à l'extérieur
    if (!e.target.closest('.bottom-sheet') && !e.target.closest('.nav-item')) {
        closeAllSheets();
    }
    
    // Fermer les widgets
    if (!e.target.closest('.weather-widget') && !e.target.closest('.weather-btn')) {
        closeWeatherWidget();
    }
}

function handleKeyDown(e) {
    if (e.key === 'Escape') {
        closeAllSheets();
        closeWeatherWidget();
        closeTrailPanel();
    }
}

// 🗺️ Initialisation de la carte avec styles nature
function initializeMap() {
    try {
        // Initialiser la carte Leaflet
        map = L.map('hike-map', {
            zoomControl: false,
            attributionControl: false,
            preferCanvas: true
        }).setView([46.2276, 2.2137], 6); // Centre de la France

        // Styles de cartes pour randonnée
        const mapStyles = {
            outdoor: L.tileLayer('https://tile.thunderforest.com/outdoors/{z}/{x}/{y}.png?apikey=demo', {
                maxZoom: 18,
                attribution: 'Thunderforest'
            }),
            
            satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                maxZoom: 18,
                attribution: 'Esri'
            }),
            
            terrain: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
                maxZoom: 17,
                attribution: 'OpenTopoMap'
            }),
            
            standard: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: 'OpenStreetMap'
            })
        };

        // Commencer avec le style outdoor
        mapStyles.outdoor.addTo(map);
        window.mapStyles = mapStyles;

        // Créer les couches
        markersLayer = L.layerGroup().addTo(map);
        routeLayer = L.layerGroup().addTo(map);
        discoveryLayer = L.layerGroup().addTo(map);
        weatherLayer = L.layerGroup();

        // Événements de carte
        map.on('click', onMapClick);
        map.on('locationfound', onLocationFound);
        map.on('locationerror', onLocationError);

        // Localisation initiale
        map.locate({setView: true, maxZoom: 14});

        console.log('✅ Carte HiKe initialisée avec succès');
    } catch (error) {
        console.error('❌ Erreur initialisation carte:', error);
        showToast('Erreur lors du chargement de la carte', 'error');
    }
}

function onMapClick(e) {
    if (selectedDiscoveryType) {
        // Mode partage de découverte
        shareDiscoveryAtLocation(e.latlng, selectedDiscoveryType);
        selectedDiscoveryType = null;
        closeAllSheets();
    }
}

function onLocationFound(e) {
    userLocation = e.latlng;
    
    // Créer marqueur utilisateur avec animation
    const userIcon = L.divIcon({
        html: `
            <div class="user-marker-pulse">
                <div class="user-marker">
                    <i class="fas fa-hiking"></i>
                </div>
            </div>
        `,
        iconSize: [30, 30],
        className: 'user-location-marker'
    });
    
    markersLayer.clearLayers();
    L.marker(e.latlng, {icon: userIcon})
        .addTo(markersLayer)
        .bindPopup(`
            <div class="custom-popup">
                <div class="popup-header">
                    <i class="fas fa-location-arrow"></i>
                    Votre position
                </div>
                <div class="popup-content">
                    <p>Vous êtes ici !</p>
                    <div class="popup-meta">
                        <span>📍 ${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}</span>
                    </div>
                </div>
            </div>
        `);
    
    console.log('📍 Position trouvée:', e.latlng);
    
    // Charger les sentiers proches automatiquement
    setTimeout(() => {
        showNearbyTrails();
    }, 2000);
}

function onLocationError(e) {
    console.warn('⚠️ Erreur géolocalisation:', e.message);
    showToast('Impossible d\'obtenir votre position', 'warning');
}

function updateUserLocation(position) {
    userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
    };
    
    if (map && markersLayer) {
        onLocationFound({latlng: userLocation});
    }
    
    // Mettre à jour la navigation si active
    if (activeHike && currentTrail) {
        updateHikeProgress();
    }
}

function handleLocationError(error) {
    console.warn('❌ Erreur suivi position:', error.message);
}

function setupLocationTracking() {
    if ('geolocation' in navigator) {
        navigator.geolocation.watchPosition(
            updateUserLocation,
            handleLocationError,
            {
                enableHighAccuracy: true,
                timeout: 30000,
                maximumAge: 60000
            }
        );
    }
}

// 🧭 Navigation et onglets
function switchMainTab(tabName) {
    // Mettre à jour la navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Fermer tous les sheets
    closeAllSheets();
    
    // Ouvrir le sheet correspondant
    switch(tabName) {
        case 'explore':
            // Mode exploration - rien à ouvrir
            break;
        case 'plan':
            openBottomSheet('plan-sheet');
            break;
        case 'discover':
            openBottomSheet('discover-sheet');
            loadRecentDiscoveries();
            break;
        case 'profile':
            openBottomSheet('profile-sheet');
            break;
    }
}

function openBottomSheet(sheetId) {
    closeAllSheets();
    
    const sheet = document.getElementById(sheetId);
    if (sheet) {
        sheet.classList.remove('hidden');
        
        // Animation
        setTimeout(() => {
            sheet.style.transform = 'translateY(0)';
        }, 10);
    }
}

function closeAllSheets() {
    const sheets = document.querySelectorAll('.bottom-sheet');
    sheets.forEach(sheet => {
        sheet.classList.add('hidden');
        sheet.style.transform = 'translateY(100%)';
    });
    
    // Réinitialiser les formulaires
    resetDiscoveryForm();
}

// 🔍 Recherche de sentiers
function toggleTrailSearch() {
    const searchBar = document.getElementById('trail-search');
    searchBar.classList.toggle('hidden');
}

async function searchTrails() {
    const difficulty = document.getElementById('difficulty-filter').value;
    const region = document.getElementById('region-filter').value;
    const distance = document.getElementById('distance-filter').value;
    
    showLoading('Recherche de sentiers...');
    
    try {
        const params = new URLSearchParams();
        if (difficulty) params.append('difficulty', difficulty);
        if (region) params.append('region', region);
        if (distance) params.append('distance', distance);
        
        const response = await fetch(`${API_BASE}/trails?${params}`);
        const result = await response.json();
        
        hideLoading();
        
        if (result.success) {
            displayTrailsOnMap(result.data);
            showToast(`${result.total} sentier(s) trouvé(s)`, 'success');
            toggleTrailSearch(); // Fermer la recherche
        } else {
            showToast('Aucun sentier trouvé', 'warning');
        }
    } catch (error) {
        hideLoading();
        console.error('Erreur recherche sentiers:', error);
        showToast('Erreur lors de la recherche', 'error');
    }
}

function displayTrailsOnMap(trails) {
    // Nettoyer les marqueurs précédents (sauf utilisateur)
    const userMarker = markersLayer.getLayers().find(layer => 
        layer.getElement && layer.getElement().classList.contains('user-location-marker')
    );
    
    markersLayer.clearLayers();
    
    // Remettre le marqueur utilisateur
    if (userMarker) {
        markersLayer.addLayer(userMarker);
    }
    
    // Ajouter les sentiers
    trails.forEach(trail => {
        const difficultyColor = getDifficultyColor(trail.difficulty);
        
        const trailIcon = L.divIcon({
            html: `
                <div class="trail-marker start" style="background: ${difficultyColor}">
                    <i class="fas fa-route"></i>
                </div>
            `,
            iconSize: [32, 32],
            className: 'trail-marker-icon'
        });
        
        const marker = L.marker([trail.location.lat, trail.location.lng], {icon: trailIcon})
            .addTo(markersLayer)
            .bindPopup(`
                <div class="custom-popup">
                    <div class="popup-header">
                        <i class="fas fa-mountain"></i>
                        ${trail.name}
                    </div>
                    <div class="popup-content">
                        <h4>${trail.name}</h4>
                        <p>${trail.description}</p>
                        <div class="trail-quick-stats">
                            <span class="difficulty-badge ${trail.difficulty}">${getDifficultyText(trail.difficulty)}</span>
                            <span>📏 ${trail.distance}</span>
                            <span>⏱️ ${trail.duration}</span>
                            <span>⛰️ ${trail.elevation}</span>
                        </div>
                        <div class="popup-meta">
                            <span>⭐ ${trail.rating}/5</span>
                            <button onclick="showTrailDetails(${trail.id})" class="popup-btn">
                                Voir détails
                            </button>
                        </div>
                    </div>
                </div>
            `);
        
        // Stocker les données du sentier
        marker.trailData = trail;
    });
    
    // Ajuster la vue si des sentiers sont trouvés
    if (trails.length > 0) {
        const bounds = L.latLngBounds(trails.map(t => [t.location.lat, t.location.lng]));
        map.fitBounds(bounds, {padding: [50, 50]});
    }
}

function getDifficultyColor(difficulty) {
    switch(difficulty) {
        case 'easy': return '#10b981';
        case 'moderate': return '#f59e0b';
        case 'hard': return '#ef4444';
        default: return '#6b7280';
    }
}

function getDifficultyText(difficulty) {
    switch(difficulty) {
        case 'easy': return 'Facile 🟢';
        case 'moderate': return 'Modéré 🟡';
        case 'hard': return 'Difficile 🔴';
        default: return 'Non défini';
    }
}

async function showTrailDetails(trailId) {
    try {
        const response = await fetch(`${API_BASE}/trails/${trailId}`);
        const result = await response.json();
        
        if (result.success) {
            currentTrail = result.data;
            displayTrailPanel(result.data);
        }
    } catch (error) {
        console.error('Erreur récupération détails sentier:', error);
        showToast('Erreur lors du chargement des détails', 'error');
    }
}

function displayTrailPanel(trail) {
    document.getElementById('trail-name').textContent = trail.name;
    document.getElementById('trail-distance').textContent = trail.distance;
    document.getElementById('trail-duration').textContent = trail.duration;
    document.getElementById('trail-elevation').textContent = trail.elevation;
    document.getElementById('trail-rating').textContent = trail.rating;
    document.getElementById('trail-desc').textContent = trail.description;
    
    document.getElementById('trail-info-panel').classList.remove('hidden');
}

function closeTrailPanel() {
    document.getElementById('trail-info-panel').classList.add('hidden');
    currentTrail = null;
}

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

// 🥾 Démarrage et gestion des randonnées
function startHike() {
    if (!currentTrail) {
        showToast('Aucun sentier sélectionné', 'error');
        return;
    }
    
    startActiveHike(currentTrail);
}

function startPlannedHike() {
    if (!currentTrail) {
        showToast('Aucune randonnée planifiée', 'error');
        return;
    }
    
    startActiveHike(currentTrail);
}

function startActiveHike(trail) {
    activeHike = true;
    hikeStartTime = new Date();
    currentTrail = trail;
    
    // Afficher l'overlay de navigation
    document.getElementById('active-hike-overlay').classList.remove('hidden');
    document.getElementById('active-trail-name').textContent = trail.name || 'Randonnée personnalisée';
    
    // Fermer les panels et sheets
    closeTrailPanel();
    closeAllSheets();
    
    // Démarrer le timer
    startHikeTimer();
    
    // Centrer sur la position utilisateur
    if (userLocation) {
        map.setView(userLocation, 16);
    }
    
    showToast('🥾 Randonnée démarrée ! Bon voyage !', 'success');
    
    // Notification push si supportée
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('HiKe - Randonnée démarrée', {
            body: `Profitez de votre randonnée "${trail.name}" !`,
            icon: '/icon-192.png'
        });
    }
    
    console.log('🥾 Randonnée active démarrée:', trail);
}

function startHikeTimer() {
    if (hikeTimer) {
        clearInterval(hikeTimer);
    }
    
    hikeTimer = setInterval(() => {
        if (activeHike && hikeStartTime) {
            const elapsed = new Date() - hikeStartTime;
            const hours = Math.floor(elapsed / 3600000);
            const minutes = Math.floor((elapsed % 3600000) / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            
            const timeString = hours > 0 
                ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
                : `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            document.getElementById('hike-elapsed-time').textContent = timeString;
            
            // Simulation de mise à jour de distance restante
            if (currentTrail) {
                const baseDistance = parseFloat(currentTrail.distance) || 5;
                const progressPercent = Math.min(elapsed / (2 * 3600000), 1); // 2h pour finir
                const remaining = (baseDistance * (1 - progressPercent)).toFixed(1);
                document.getElementById('hike-remaining-distance').textContent = `${remaining} km restants`;
                
                // Simulation d'instructions
                updateHikeInstructions();
            }
        }
    }, 1000);
}

function updateHikeInstructions() {
    const instructions = [
        'Continuez sur le sentier principal',
        'Tournez à droite au prochain embranchement',
        'Attention, passage technique à venir',
        'Point de vue dans 200m sur votre gauche',
        'Continuez tout droit',
        'Suivez le balisage rouge et blanc',
        'Montée raide sur 500m',
        'Attention à la descente glissante',
        'Vous approchez du sommet !',
        'Profitez de la vue panoramique'
    ];
    
    const randomInstruction = instructions[Math.floor(Math.random() * instructions.length)];
    const randomDistance = Math.floor(Math.random() * 500) + 50;
    
    document.getElementById('next-instruction').textContent = randomInstruction;
    document.getElementById('next-distance').textContent = `Dans ${randomDistance}m`;
}

function updateHikeProgress() {
    if (!activeHike || !userLocation || !currentTrail) return;
    
    // Ici tu pourrais calculer la vraie progression avec la géolocalisation
    // Pour la démo, on simule
    console.log('📍 Mise à jour progression randonnée:', userLocation);
}

function pauseActiveHike() {
    if (hikeTimer) {
        clearInterval(hikeTimer);
        hikeTimer = null;
    }
    
    const pauseBtn = document.querySelector('.pause-hike-btn i');
    if (pauseBtn.classList.contains('fa-pause')) {
        pauseBtn.className = 'fas fa-play';
        showToast('Randonnée mise en pause', 'info');
    } else {
        pauseBtn.className = 'fas fa-pause';
        startHikeTimer();
        showToast('Randonnée reprise', 'success');
    }
}

function stopActiveHike() {
    if (confirm('Êtes-vous sûr de vouloir arrêter la randonnée ?')) {
        activeHike = false;
        
        // Calculer les stats de la randonnée
        const elapsed = hikeStartTime ? new Date() - hikeStartTime : 0;
        const hours = Math.floor(elapsed / 3600000);
        const minutes = Math.floor((elapsed % 3600000) / 60000);
        
        // Arrêter le timer
        if (hikeTimer) {
            clearInterval(hikeTimer);
            hikeTimer = null;
        }
        
        // Masquer l'overlay
        document.getElementById('active-hike-overlay').classList.add('hidden');
        
        // Nettoyer
        routeLayer.clearLayers();
        hikeStartTime = null;
        
        // Ajouter des points et stats au profil
        if (currentHiker) {
            const distance = parseFloat(currentTrail?.distance) || 0;
            const elevation = parseInt(currentTrail?.elevation?.replace(/\D/g, '')) || 0;
            
            addHikeToProfile(distance, elevation, elapsed);
        }
        
        showToast(`🏁 Randonnée terminée ! Durée: ${hours}h ${minutes}min`, 'success');
        
        // Notification
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('HiKe - Randonnée terminée', {
                body: `Félicitations ! Vous avez terminé votre randonnée en ${hours}h ${minutes}min`,
                icon: '/icon-192.png'
            });
        }
        
        currentTrail = null;
        console.log('🏁 Randonnée terminée');
    }
}

function saveTrail() {
    if (!currentTrail) {
        showToast('Aucun sentier à sauvegarder', 'error');
        return;
    }
    
    // Sauvegarder dans localStorage
    let savedTrails = JSON.parse(localStorage.getItem('hikeApp_savedTrails') || '[]');
    
    // Vérifier si déjà sauvegardé
    const alreadySaved = savedTrails.some(trail => trail.id === currentTrail.id);
    
    if (alreadySaved) {
        showToast('Sentier déjà sauvegardé', 'info');
        return;
    }
    
    savedTrails.push(currentTrail);
    localStorage.setItem('hikeApp_savedTrails', JSON.stringify(savedTrails));
    
    showToast('Sentier sauvegardé !', 'success');
}

function savePlannedHike() {
    saveTrail(); // Même logique
}

// ... (suite du fichier précédent)

// 📸 Découvertes et partage
function selectDiscoveryType(type) {
    selectedDiscoveryType = type;
    
    // Mettre à jour l'UI
    document.querySelectorAll('.discovery-type-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    document.querySelector(`[data-type="${type}"]`).classList.add('selected');
    
    // Afficher le formulaire
    document.getElementById('discovery-form').classList.remove('hidden');
    
    showToast(`Mode ${discoveryTypes[type].name} activé - Touchez la carte pour partager !`, 'info');
}

async function shareDiscovery() {
    if (!selectedDiscoveryType) {
        showToast('Veuillez sélectionner un type de découverte', 'error');
        return;
    }

    const title = document.getElementById('discovery-title').value.trim();
    const description = document.getElementById('discovery-description').value.trim();
    const photoInput = document.getElementById('discovery-photo');
    
    if (!title) {
        showToast('Veuillez ajouter un titre à votre découverte', 'error');
        return;
    }

    const discoveryLocation = userLocation || { lat: 46.2276, lng: 2.2137 };

    try {
        // Gérer la photo si uploadée
        let photoData = null;
        if (photoInput.files && photoInput.files[0]) {
            photoData = await convertFileToBase64(photoInput.files[0]);
        }

        const response = await fetch(`${API_BASE}/discoveries`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: selectedDiscoveryType,
                location: discoveryLocation,
                title,
                description,
                photos: photoData ? [photoData] : []
            })
        });

        const result = await response.json();

        if (result.success) {
            showToast('🎉 Découverte partagée avec succès !', 'success');
            
            // Ajouter sur la carte
            addDiscoveryToMap(result.data);
            
            // Réinitialiser le formulaire
            resetDiscoveryForm();
            closeAllSheets();
            
            // Ajouter des points au profil
            addDiscoveryToProfile();
            
            // Recharger la liste
            loadRecentDiscoveries();
            
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        console.error('Erreur partage découverte:', error);
        showToast('Erreur lors du partage', 'error');
    }
}

async function shareDiscoveryAtLocation(latlng, type) {
    try {
        const response = await fetch(`${API_BASE}/discoveries`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type,
                location: latlng,
                title: `${discoveryTypes[type].name} découvert`,
                description: `Nouvelle découverte de type ${discoveryTypes[type].name} partagée depuis la carte`
            })
        });

        const result = await response.json();

        if (result.success) {
            showToast(`🎉 ${discoveryTypes[type].name} partagé !`, 'success');
            addDiscoveryToMap(result.data);
            addDiscoveryToProfile();
        }
    } catch (error) {
        console.error('Erreur partage découverte:', error);
        showToast('Erreur lors du partage', 'error');
    }
}

function convertFileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function addDiscoveryToMap(discovery) {
    if (!map || !discovery.location) return;

    const discoveryType = discoveryTypes[discovery.type];
    if (!discoveryType) return;

    const discoveryIcon = L.divIcon({
        html: `
            <div class="discovery-marker" style="background-color: ${discoveryType.color}">
                <i class="${discoveryType.icon}"></i>
            </div>
        `,
        iconSize: [32, 32],
        className: 'discovery-marker-icon'
    });

    const marker = L.marker([discovery.location.lat, discovery.location.lng], {icon: discoveryIcon})
        .addTo(discoveryLayer)
        .bindPopup(`
            <div class="custom-popup">
                <div class="popup-header" style="background-color: ${discoveryType.color}">
                    <i class="${discoveryType.icon}"></i>
                    ${discoveryType.name}
                </div>
                <div class="popup-content">
                    <h4>${discovery.title}</h4>
                    <p>${discovery.description}</p>
                    ${discovery.photos && discovery.photos.length > 0 ? `
                        <div class="popup-photos">
                            ${discovery.photos.map(photo => `<img src="${photo}" alt="Photo découverte" style="width: 100%; border-radius: 8px; margin-top: 8px;">`).join('')}
                        </div>
                    ` : ''}
                    <div class="popup-meta">
                        <span>📅 ${getTimeAgo(new Date(discovery.timestamp))}</span>
                        <span>👍 ${discovery.votes} votes</span>
                    </div>
                </div>
            </div>
        `);
}

async function loadRecentDiscoveries() {
    try {
        const response = await fetch(`${API_BASE}/discoveries`);
        const result = await response.json();

        if (result.success) {
            displayDiscoveriesList(result.data);
            
            // Afficher sur la carte
            result.data.forEach(discovery => {
                addDiscoveryToMap(discovery);
            });
        }
    } catch (error) {
        console.error('Erreur chargement découvertes:', error);
    }
}

function displayDiscoveriesList(discoveries) {
    const listContainer = document.getElementById('discoveries-list');
    
    if (discoveries.length === 0) {
        listContainer.innerHTML = '<p class="text-center">Aucune découverte récente</p>';
        return;
    }

    listContainer.innerHTML = discoveries.map(discovery => {
        const discoveryType = discoveryTypes[discovery.type];
        return `
            <div class="discovery-item" onclick="focusOnDiscovery(${discovery.location.lat}, ${discovery.location.lng})">
                <div class="discovery-header">
                    <div class="discovery-title">
                        <i class="${discoveryType.icon}" style="color: ${discoveryType.color}"></i>
                        ${discovery.title}
                    </div>
                    <div class="discovery-votes">
                        <i class="fas fa-thumbs-up"></i>
                        ${discovery.votes}
                    </div>
                </div>
                <div class="discovery-description">${discovery.description}</div>
                <div class="discovery-meta">
                    <span>${discoveryType.name}</span>
                    <span>${getTimeAgo(new Date(discovery.timestamp))}</span>
                </div>
            </div>
        `;
    }).join('');
}

function focusOnDiscovery(lat, lng) {
    map.setView([lat, lng], 16);
    closeAllSheets();
    showToast('Découverte localisée sur la carte', 'info');
}

function resetDiscoveryForm() {
    selectedDiscoveryType = null;
    document.getElementById('discovery-title').value = '';
    document.getElementById('discovery-description').value = '';
    document.getElementById('discovery-photo').value = '';
    document.getElementById('discovery-form').classList.add('hidden');
    
    document.querySelectorAll('.discovery-type-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
}

function cancelDiscovery() {
    resetDiscoveryForm();
    closeAllSheets();
}

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

// 🗺️ Contrôles de carte
function centerOnLocation() {
    if (userLocation && map) {
        map.setView(userLocation, 16);
        showToast('Carte centrée sur votre position', 'success');
    } else {
        showToast('Position non disponible', 'warning');
        map.locate({setView: true, maxZoom: 16});
    }
}

function toggleMapLayers() {
    if (!map || !window.mapStyles) return;
    
    const styles = ['outdoor', 'satellite', 'terrain', 'standard'];
    const currentIndex = styles.indexOf(mapStyle);
    const nextIndex = (currentIndex + 1) % styles.length;
    const nextStyle = styles[nextIndex];
    
    // Supprimer l'ancien layer
    map.eachLayer(layer => {
        if (layer instanceof L.TileLayer) {
            map.removeLayer(layer);
        }
    });
    
    // Ajouter le nouveau style
    window.mapStyles[nextStyle].addTo(map);
    mapStyle = nextStyle;
    
    const styleNames = {
        outdoor: 'Randonnée 🥾',
        satellite: 'Satellite 🛰️',
        terrain: 'Terrain 🗻',
        standard: 'Standard 🗺️'
    };
    
    showToast(`Style: ${styleNames[nextStyle]}`, 'info');
}

async function showNearbyTrails() {
    if (!userLocation) {
        showToast('Position requise pour trouver les sentiers proches', 'warning');
        return;
    }

    showLoading('Recherche de sentiers proches...');

    try {
        // Simuler la recherche de sentiers proches
        const response = await fetch(`${API_BASE}/trails`);
        const result = await response.json();

        hideLoading();

        if (result.success) {
            // Filtrer les sentiers proches (simulation)
            const nearbyTrails = result.data.filter(() => Math.random() > 0.5);
            
            if (nearbyTrails.length > 0) {
                displayTrailsOnMap(nearbyTrails);
                showToast(`${nearbyTrails.length} sentier(s) proche(s) trouvé(s)`, 'success');
            } else {
                showToast('Aucun sentier proche trouvé', 'info');
            }
        }
    } catch (error) {
        hideLoading();
        console.error('Erreur recherche sentiers proches:', error);
        showToast('Erreur lors de la recherche', 'error');
    }
}

// 👤 Profil randonneur
async function saveHikerProfile() {
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const experience = document.getElementById('experience-level').value;

    if (!username || !email) {
        showToast('Nom d\'utilisateur et email requis', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/hikers/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, experience })
        });

        const result = await response.json();

        if (result.success) {
            currentHiker = result.data;
            updateHikerDisplay();
            showToast('Profil sauvegardé avec succès !', 'success');
            closeAllSheets();
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        console.error('Erreur sauvegarde profil:', error);
        showToast('Erreur lors de la sauvegarde', 'error');
    }
}

function loadHikerProfile() {
    // Charger depuis localStorage
    const savedHiker = localStorage.getItem('hikeApp_hiker');
    if (savedHiker) {
        currentHiker = JSON.parse(savedHiker);
        updateHikerDisplay();
    }
}

function updateHikerDisplay() {
    if (!currentHiker) return;
    
    // Mettre à jour les informations
    document.getElementById('hiker-name').textContent = currentHiker.username;
    document.getElementById('hiker-experience').textContent = currentHiker.experience;
    document.getElementById('user-level-badge').textContent = currentHiker.level;
    
    // Mettre à jour les statistiques
    const stats = currentHiker.stats || {};
    document.getElementById('total-distance').textContent = stats.totalDistance || 0;
    document.getElementById('total-elevation').textContent = stats.totalElevation || 0;
    document.getElementById('hikes-completed').textContent = stats.hikesCompleted || 0;
    document.getElementById('discoveries-shared').textContent = stats.discoveryShared || 0;
    
    // Sauvegarder dans localStorage
    localStorage.setItem('hikeApp_hiker', JSON.stringify(currentHiker));
}

function addHikeToProfile(distance, elevation, duration) {
    if (!currentHiker) {
        currentHiker = {
            username: 'Randonneur',
            level: 'Apprenti Randonneur',
            stats: {
                totalDistance: 0,
                totalElevation: 0,
                hikesCompleted: 0,
                discoveryShared: 0
            }
        };
    }
    
    // Ajouter les nouvelles stats
    currentHiker.stats.totalDistance += distance;
    currentHiker.stats.totalElevation += elevation;
    currentHiker.stats.hikesCompleted += 1;
    
    // Calculer le nouveau niveau
    updateHikerLevel();
    
    // Mettre à jour l'affichage
    updateHikerDisplay();
    
    showToast(`+${distance}km et +${elevation}m ajoutés à vos statistiques !`, 'success');
}

function addDiscoveryToProfile() {
    if (!currentHiker) {
        currentHiker = {
            username: 'Randonneur',
            level: 'Apprenti Randonneur',
            stats: {
                totalDistance: 0,
                totalElevation: 0,
                hikesCompleted: 0,
                discoveryShared: 0
            }
        };
    }
    
    currentHiker.stats.discoveryShared += 1;
    updateHikerLevel();
    updateHikerDisplay();
}

function updateHikerLevel() {
    if (!currentHiker || !currentHiker.stats) return;
    
    const stats = currentHiker.stats;
    const totalPoints = stats.totalDistance * 10 + stats.totalElevation * 0.1 + 
                       stats.hikesCompleted * 50 + stats.discoveryShared * 20;
    
    if (totalPoints >= 1000) {
        currentHiker.level = 'Expert Randonneur 🏆';
    } else if (totalPoints >= 500) {
        currentHiker.level = 'Randonneur Confirmé 🥇';
    } else if (totalPoints >= 200) {
        currentHiker.level = 'Randonneur Intermédiaire 🥈';
    } else if (totalPoints >= 50) {
        currentHiker.level = 'Randonneur Débutant 🥉';
    } else {
        currentHiker.level = 'Apprenti Randonneur 🌱';
    }
}

// 🔔 Utilitaires et notifications
function showToast(message, type = 'success', duration = 3000) {
    const toastContainer = document.getElementById('toast-container');
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    
    toast.innerHTML = `
        <i class="${icons[type] || icons.info}"></i>
        <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    // Animation d'entrée
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Suppression automatique
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

function showLoading(message = 'Chargement...') {
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingText = document.getElementById('loading-text');
    
    loadingText.textContent = message;
    loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
    const loadingOverlay = document.getElementById('loading-overlay');
    loadingOverlay.classList.add('hidden');
}

function getTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'À l\'instant';
    if (diffInSeconds < 3600) return `il y a ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `il y a ${Math.floor(diffInSeconds / 3600)} h`;
    if (diffInSeconds < 604800) return `il y a ${Math.floor(diffInSeconds / 86400)} j`;
    return `il y a ${Math.floor(diffInSeconds / 604800)} sem`;
}

// 📱 Fonctions PWA et données initiales
function loadInitialData() {
    loadRecentDiscoveries();
    loadHikerProfile();
    
    // Charger les sentiers favoris
    loadSavedTrails();
    
    console.log('✅ Données initiales chargées');
}

function loadSavedTrails() {
    const savedTrails = JSON.parse(localStorage.getItem('hikeApp_savedTrails') || '[]');
    console.log(`📚 ${savedTrails.length} sentier(s) sauvegardé(s) chargé(s)`);
}

// Menu principal
function toggleMainMenu() {
    // Pour l'instant, on utilise juste la navigation bottom
    // Tu peux ajouter un menu hamburger plus tard si besoin
    showToast('Utilisez la navigation en bas de l\'écran', 'info');
}

// Gestion des erreurs globales
window.addEventListener('error', function(e) {
    console.error('❌ Erreur globale:', e.error);
    showToast('Une erreur inattendue s\'est produite', 'error');
});

// Gestion de la connectivité
window.addEventListener('online', () => {
    showToast('📶 Connexion rétablie', 'success');
});

window.addEventListener('offline', () => {
    showToast('📵 Mode hors ligne activé', 'warning');
});

// Debug pour développement
if (window.location.hostname === 'localhost') {
    window.hikeDebug = {
        map,
        currentHiker,
        currentTrail,
        userLocation,
        activeHike,
        showToast,
        addHikeToProfile,
        addDiscoveryToProfile
    };
    console.log('🔧 Mode debug HiKe activé. Utilisez window.hikeDebug');
}

console.log('🥾 HiKe JavaScript chargé avec succès !');