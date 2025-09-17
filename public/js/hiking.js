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