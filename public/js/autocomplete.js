// 🗺️ Autocomplete pour les lieux de randonnée

// Base de données des lieux populaires en France
const popularLocations = [
    // Grandes villes
    'Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Montpellier', 'Strasbourg', 'Bordeaux', 'Lille',
    'Rennes', 'Reims', 'Le Havre', 'Saint-Étienne', 'Toulon', 'Grenoble', 'Dijon', 'Angers', 'Nîmes', 'Villeurbanne',
    
    // Lieux de randonnée célèbres
    'Chamonix-Mont-Blanc', 'Annecy', 'Briançon', 'Val d\'Isère', 'Megève', 'La Clusaz', 'Avoriaz', 'Les Gets',
    'Courchevel', 'Méribel', 'Tignes', 'Les Deux Alpes', 'Alpe d\'Huez', 'Serre Chevalier',
    
    // Parcs nationaux et régions
    'Parc National du Mercantour', 'Parc National des Écrins', 'Parc National de la Vanoise',
    'Parc National des Pyrénées', 'Parc National des Cévennes', 'Parc National de la Guadeloupe',
    'Parc National de Port-Cros', 'Parc National des Calanques',
    
    // Massifs montagneux
    'Mont-Blanc', 'Pic du Midi', 'Vignemale', 'Aneto', 'Pic de Néouvielle', 'Barre des Écrins',
    'La Meije', 'Mont Pelvoux', 'Dôme de Neige des Écrins', 'Pic de la Muande',
    
    // Régions géographiques
    'Alpes du Nord', 'Alpes du Sud', 'Pyrénées Orientales', 'Pyrénées Atlantiques',
    'Massif Central', 'Vosges', 'Jura', 'Corse', 'Provence', 'Languedoc',
    'Normandie', 'Bretagne', 'Alsace', 'Lorraine', 'Champagne', 'Bourgogne',
    
    // Destinations nature spécifiques
    'Gorges du Verdon', 'Cirque de Gavarnie', 'Cirque de Troumouse', 'Cirque d\'Estaubé',
    'Canyon de la Nesque', 'Gorges de l\'Ardèche', 'Gorges du Tarn', 'Gorges de la Jonte',
    'Lac d\'Annecy', 'Lac du Bourget', 'Lac Léman', 'Lac de Serre-Ponçon',
    'Calanques de Marseille', 'Calanque d\'En-Vau', 'Calanque de Sormiou',
    'Forêt de Fontainebleau', 'Forêt de Compiègne', 'Forêt des Landes',
    
    // Îles et côtes
    'Île de Ré', 'Île d\'Oléron', 'Belle-Île-en-Mer', 'Île de Noirmoutier',
    'Côte d\'Azur', 'Côte Vermeille', 'Côte Basque', 'Côte de Granit Rose',
    'Sentier des Douaniers GR34', 'Chemin de Stevenson', 'GR20 Corse',
    
    // Villes de montagne et stations
    'Bourg-Saint-Maurice', 'Albertville', 'Sallanches', 'Cluses', 'Thonon-les-Bains',
    'Évian-les-Bains', 'Saint-Gervais-les-Bains', 'Les Houches', 'Argentière',
    'Vallorcine', 'Samoëns', 'Sixt-Fer-à-Cheval', 'Pralognan-la-Vanoise',
    'Champagny-en-Vanoise', 'La Plagne', 'Les Arcs', 'Peisey-Vallandry'
];

let currentSuggestions = [];
let activeSuggestionIndex = -1;

function initializeAutocomplete() {
    const startInput = document.getElementById('start-point');
    const endInput = document.getElementById('end-point');
    
    if (startInput) {
        setupAutocomplete(startInput, 'start');
    }
    if (endInput) {
        setupAutocomplete(endInput, 'end');
    }
}

function setupAutocomplete(input, type) {
    const containerId = `autocomplete-${type}`;
    
    // Créer le conteneur de suggestions s'il n'existe pas
    let container = document.getElementById(containerId);
    if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        container.className = 'autocomplete-suggestions hidden';
        input.parentNode.appendChild(container);
    }
    
    // Événements
    input.addEventListener('input', (e) => handleInputChange(e, container, type));
    input.addEventListener('keydown', (e) => handleKeyDown(e, container, type));
    input.addEventListener('blur', () => {
        // Délai pour permettre le clic sur une suggestion
        setTimeout(() => hideSuggestions(container), 150);
    });
    input.addEventListener('focus', (e) => {
        if (e.target.value.length >= 2) {
            handleInputChange(e, container, type);
        }
    });
}

function handleInputChange(event, container, type) {
    const query = event.target.value.trim().toLowerCase();
    
    if (query.length < 2) {
        hideSuggestions(container);
        return;
    }
    
    // Filtrer les suggestions
    const suggestions = popularLocations.filter(location => 
        location.toLowerCase().includes(query)
    ).slice(0, 8); // Limiter à 8 suggestions
    
    if (suggestions.length === 0) {
        hideSuggestions(container);
        return;
    }
    
    // Afficher les suggestions
    showSuggestions(container, suggestions, type, event.target);
}

function handleKeyDown(event, container, type) {
    const suggestions = container.querySelectorAll('.suggestion-item');
    
    if (event.key === 'ArrowDown') {
        event.preventDefault();
        activeSuggestionIndex = Math.min(activeSuggestionIndex + 1, suggestions.length - 1);
        updateActiveSuggestion(suggestions);
    } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        activeSuggestionIndex = Math.max(activeSuggestionIndex - 1, -1);
        updateActiveSuggestion(suggestions);
    } else if (event.key === 'Enter') {
        if (activeSuggestionIndex >= 0 && suggestions[activeSuggestionIndex]) {
            event.preventDefault();
            selectSuggestion(suggestions[activeSuggestionIndex].textContent, event.target, container);
        }
    } else if (event.key === 'Escape') {
        hideSuggestions(container);
        event.target.blur();
    }
}

function showSuggestions(container, suggestions, type, input) {
    container.innerHTML = '';
    currentSuggestions = suggestions;
    activeSuggestionIndex = -1;
    
    suggestions.forEach((suggestion, index) => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.textContent = suggestion;
        item.addEventListener('click', () => {
            selectSuggestion(suggestion, input, container);
        });
        container.appendChild(item);
    });
    
    container.classList.remove('hidden');
}

function hideSuggestions(container) {
    container.classList.add('hidden');
    activeSuggestionIndex = -1;
}

function updateActiveSuggestion(suggestions) {
    suggestions.forEach((item, index) => {
        if (index === activeSuggestionIndex) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

function selectSuggestion(suggestion, input, container) {
    input.value = suggestion;
    hideSuggestions(container);
    input.focus();
    
    // Déclencher un événement change
    const event = new Event('change', { bubbles: true });
    input.dispatchEvent(event);
    
    showToast(`📍 ${suggestion} sélectionné`, 'success');
}

// Initialiser au chargement de la page
document.addEventListener('DOMContentLoaded', initializeAutocomplete);