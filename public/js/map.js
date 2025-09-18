// 🗺️ Gestion de la carte et géolocalisation

// Initialisation de la carte simplifiée pour randonnée  
function initializeMap() {
    try {
        // Initialiser la vraie carte Leaflet
        map = L.map('hike-map').setView([46.2276, 2.2137], 6);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: 'OpenStreetMap'
        }).addTo(map);
        // Initialiser les couches
        if (typeof discoveryLayer === 'undefined' || !discoveryLayer) {
            discoveryLayer = L.layerGroup().addTo(map);
        }
        if (typeof routeLayer === 'undefined' || !routeLayer) {
            routeLayer = L.layerGroup().addTo(map);
        }
        
        // Ajouter les événements de géolocalisation
        map.on('locationfound', onLocationFound);
        map.on('locationerror', onLocationError);
        map.on('click', onMapClick);
        
        console.log('✅ Carte Leaflet initialisée avec toutes les couches');
    } catch (error) {
        console.error('❌ Erreur initialisation carte:', error);
        const mapContainer = document.getElementById('hike-map');
        mapContainer.innerHTML = '<div class="map-error">Erreur lors du chargement de la carte de randonnée</div>';
        showToast('Erreur lors du chargement de la carte', 'error');
    }
}

function displaySampleTrails() {
    // Afficher des sentiers d'exemple dans la carte
    const mapContent = document.querySelector('.map-content');
    if (mapContent) {
        const trailsOverlay = document.createElement('div');
        trailsOverlay.className = 'trails-overlay';
        trailsOverlay.innerHTML = `
            <div class="sample-trail easy" style="top: 20%; left: 15%;">
                <i class="fas fa-route"></i>
                <span>Sentier des Érables (5km)</span>
            </div>
            <div class="sample-trail moderate" style="top: 40%; left: 60%;">
                <i class="fas fa-mountain"></i>
                <span>Col des Nuages (12km)</span>
            </div>
            <div class="sample-trail hard" style="top: 70%; left: 25%;">
                <i class="fas fa-climbing"></i>
                <span>Pic du Randonneur (18km)</span>
            </div>
        `;
        mapContent.appendChild(trailsOverlay);
    }
}

function onMapClick(e) {
    // Simplified click handler for hiking map
    if (selectedDiscoveryType) {
        // Mode partage de découverte
        console.log('Discovery mode activated:', selectedDiscoveryType);
        selectedDiscoveryType = null;
        closeAllSheets();
    }
}

function onLocationFound(e) {
    userLocation = {
        lat: e.latlng.lat,
        lng: e.latlng.lng
    };
    
    // Ajouter un marqueur pour la position de l'utilisateur
    if (window.userLocationMarker) {
        map.removeLayer(window.userLocationMarker);
    }
    
    window.userLocationMarker = L.circle([e.latlng.lat, e.latlng.lng], {
        radius: 10, // Réduction du rayon pour un cercle plus petit
        color: '#2563eb',
        fillColor: '#3b82f6',
        fillOpacity: 0.8, // Maintenir une bonne visibilité
        weight: 3 // Épaisseur du contour ajustée
    }).addTo(map).bindPopup('Votre position actuelle');

    // Supprimer l'ancien marqueur icône s'il existe
    if (window.userLocationIconMarker) {
        map.removeLayer(window.userLocationIconMarker);
        window.userLocationIconMarker = null;
    }
    
    console.log('📍 Position détectée :', e.latlng.lat, e.latlng.lng);
    console.log('🗑️ Suppression des anciens marqueurs si existants');
    
    console.log('✅ Position trouvée et affichée sur la carte');
    showToast('Position trouvée', 'success');
}

function onLocationError(e) {
    console.log('Location error:', e);
    showToast('Impossible de localiser votre position', 'error');
}

function updateUserLocation(position) {
    userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
    };
    console.log('Position mise à jour:', userLocation);
    
    // Mettre à jour la navigation si active
    if (activeHike && currentTrail) {
        updateHikeProgress();
    }
    
    // Forcer l'appel de onLocationFound pour afficher le cercle bleu
    onLocationFound({ latlng: { lat: userLocation.lat, lng: userLocation.lng } });
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
    if (userLocation) {
        map.setView([userLocation.lat, userLocation.lng], 18); // Augmenter le zoom à 18 pour un meilleur focus
        // showToast('Carte centrée sur votre position', 'success');
        console.log('Centrage sur:', userLocation);
    } else {
        showToast('Localisation en cours...', 'info');
        // Essayer de géolocaliser
        if (map && map.locate) {
            map.locate({setView: true, maxZoom: 18}); // Augmenter le zoom pour un meilleur focus
        } else if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    map.setView([userLocation.lat, userLocation.lng], 15);
                    showToast('Position trouvée !', 'success');
                },
                () => showToast('Impossible de localiser', 'error')
            );
        }
    }
}

function toggleMapLayers() {
    const styles = ['outdoor', 'satellite', 'terrain', 'standard'];
    const currentIndex = styles.indexOf(mapStyle);
    const nextIndex = (currentIndex + 1) % styles.length;
    const nextStyle = styles[nextIndex];
    
    mapStyle = nextStyle;
    
    const styleNames = {
        outdoor: 'Randonnée 🥾',
        satellite: 'Satellite 🛰️',
        terrain: 'Terrain 🗻',
        standard: 'Standard 🗺️'
    };
    
    showToast(`Style: ${styleNames[nextStyle]}`, 'info');
    
    // Mettre à jour l'affichage de la carte
    const mapInfo = document.querySelector('.hiking-trails-info h3');
    if (mapInfo) {
        mapInfo.textContent = `Carte de randonnée - ${styleNames[nextStyle]}`;
    }
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