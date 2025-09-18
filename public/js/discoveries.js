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
    
    // Désactiver les notifications toast
    // showToast(`Mode ${discoveryTypes[type].name} activé - Touchez la carte pour partager !`, 'info');
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