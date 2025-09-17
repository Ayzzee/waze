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