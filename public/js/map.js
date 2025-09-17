// 🗺️ Gestion de la carte et géolocalisation

// Initialisation de la carte simplifiée pour randonnée  
function initializeMap() {
    try {
        const mapContainer = document.getElementById('hike-map');
        
        // Créer une carte simple avec focus sur les sentiers de randonnée
        mapContainer.innerHTML = `
            <div class="map-placeholder">
                <div class="map-content">
                    <div class="hiking-trails-info">
                        <i class="fas fa-route"></i>
                        <h3>Carte de randonnée</h3>
                        <p>Mode randonnée activé - Affichage des sentiers</p>
                        <div class="trail-types">
                            <div class="trail-type">
                                <span class="trail-color easy"></span>
                                <span>Sentiers faciles</span>
                            </div>
                            <div class="trail-type">
                                <span class="trail-color moderate"></span>
                                <span>Sentiers modérés</span>
                            </div>
                            <div class="trail-type">
                                <span class="trail-color hard"></span>
                                <span>Sentiers difficiles</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Simuler des sentiers pour démonstration
        displaySampleTrails();
        
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
    // Simplified location handling
    console.log('Location found for hiking app');
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
        showToast('Carte centrée sur votre position', 'success');
        console.log('Centrage sur:', userLocation);
    } else {
        showToast('Position non disponible', 'warning');
        // Essayer de géolocaliser
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
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