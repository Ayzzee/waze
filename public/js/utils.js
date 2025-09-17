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
        get map() { return map; },
        get currentHiker() { return currentHiker; },
        get currentTrail() { return currentTrail; },
        get userLocation() { return userLocation; },
        get activeHike() { return activeHike; },
        showToast,
        addHikeToProfile: () => typeof addHikeToProfile !== 'undefined' ? addHikeToProfile : null,
        addDiscoveryToProfile: () => typeof addDiscoveryToProfile !== 'undefined' ? addDiscoveryToProfile : null
    };
    console.log('🔧 Mode debug HiKe activé. Utilisez window.hikeDebug');
}

console.log('🥾 HiKe JavaScript chargé avec succès !');