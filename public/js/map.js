// 🗺️ Gestion de la carte et géolocalisation

// Initialisation de la carte avec styles nature
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

// Contrôles de carte
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