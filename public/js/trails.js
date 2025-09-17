// 🔍 Recherche et gestion des sentiers

function toggleTrailSearch() {
    const searchBar = document.getElementById('trail-search');
    searchBar.classList.toggle('hidden');
}

// Fonction pour la recherche mobile
function toggleMobileSearch() {
    const searchPanel = document.getElementById('mobile-search-panel');
    searchPanel.classList.toggle('hidden');
}

async function searchTrailsMobile() {
    const difficulty = document.getElementById('mobile-difficulty-filter').value;
    const region = document.getElementById('mobile-region-filter').value;
    const distance = document.getElementById('mobile-distance-filter').value;
    
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
            toggleMobileSearch(); // Fermer la recherche
        } else {
            showToast('Aucun sentier trouvé', 'warning');
        }
    } catch (error) {
        hideLoading();
        console.error('Erreur recherche sentiers:', error);
        showToast('Erreur lors de la recherche', 'error');
    }
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
    
    // Ajouter les sentiers avec tracés réalistes
    trails.forEach(trail => {
        const difficultyColor = getDifficultyColor(trail.difficulty);
        
        // Créer le marqueur de départ
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
        
        // Ajouter le tracé réaliste du sentier si les waypoints existent
        if (trail.waypoints && trail.waypoints.length > 1) {
            drawRealisticTrailRoute(trail, difficultyColor);
        }
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

function drawRealisticTrailRoute(trail, color) {
    // Créer une ligne avec les waypoints
    const waypoints = trail.waypoints.map(wp => [wp.lat, wp.lng]);
    
    // Style du tracé selon la difficulté
    const routeStyle = {
        color: color,
        weight: getDifficultyWeight(trail.difficulty),
        opacity: 0.8,
        dashArray: getDifficultyDash(trail.difficulty),
        className: `trail-route ${trail.difficulty}`
    };
    
    // Ajouter la ligne à la carte
    const trailRoute = L.polyline(waypoints, routeStyle)
        .addTo(routeLayer)
        .bindTooltip(`${trail.name} - ${trail.distance}`, {
            permanent: false,
            direction: 'center',
            className: 'trail-tooltip'
        });
    
    // Ajouter des marqueurs pour les waypoints importants
    trail.waypoints.forEach((waypoint, index) => {
        if (index === 0 || index === trail.waypoints.length - 1) return; // Skip start/end
        
        // Marquer seulement certains waypoints importants
        if (waypoint.name.includes('Point de vue') || waypoint.name.includes('Col') || 
            waypoint.name.includes('Refuge') || waypoint.name.includes('Sommet')) {
            
            const waypointIcon = L.divIcon({
                html: `<div class="waypoint-marker" style="background: ${color}">
                         <i class="fas fa-map-pin"></i>
                       </div>`,
                iconSize: [16, 16],
                className: 'waypoint-icon'
            });
            
            L.marker([waypoint.lat, waypoint.lng], {icon: waypointIcon})
                .addTo(markersLayer)
                .bindTooltip(`${waypoint.name}<br>Alt: ${waypoint.elevation}m`, {
                    className: 'waypoint-tooltip'
                });
        }
    });
}

function getDifficultyWeight(difficulty) {
    switch(difficulty) {
        case 'easy': return 4;
        case 'moderate': return 5;
        case 'hard': return 6;
        default: return 4;
    }
}

function getDifficultyDash(difficulty) {
    switch(difficulty) {
        case 'easy': return null; // Ligne continue
        case 'moderate': return '10, 5'; // Tirets
        case 'hard': return '5, 5'; // Pointillés
        default: return null;
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