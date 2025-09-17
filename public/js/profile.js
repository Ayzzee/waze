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