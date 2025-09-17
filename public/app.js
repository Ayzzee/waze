// 🥾 HiKe - Application principale de randonnée

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