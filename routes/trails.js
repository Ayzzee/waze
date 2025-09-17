// 🥾 API Routes pour randonnées
const express = require('express');
const router = express.Router();
const { demoTrails } = require('../data/demo-data');

// Obtenir la liste des sentiers avec filtres optionnels
router.get('/', (req, res) => {
    const { difficulty, region, distance } = req.query;
    let filteredTrails = [...demoTrails];

    if (difficulty) {
        filteredTrails = filteredTrails.filter(t => t.difficulty === difficulty);
    }
    if (region) {
        filteredTrails = filteredTrails.filter(t => 
            t.location.region.toLowerCase().includes(region.toLowerCase())
        );
    }
    if (distance) {
        const maxDistance = parseFloat(distance);
        filteredTrails = filteredTrails.filter(t => 
            parseFloat(t.distance) <= maxDistance
        );
    }

    res.json({
        success: true,
        data: filteredTrails,
        total: filteredTrails.length,
        message: "Sentiers récupérés avec succès"
    });
});

// Obtenir un sentier spécifique par ID
router.get('/:id', (req, res) => {
    const trail = demoTrails.find(t => t.id == req.params.id);
    
    if (!trail) {
        return res.status(404).json({
            success: false,
            message: "Sentier non trouvé"
        });
    }

    res.json({
        success: true,
        data: trail,
        message: "Détails du sentier récupérés"
    });
});

// Planifier une randonnée personnalisée
router.post('/plan', (req, res) => {
    const { start, end, difficulty, maxDistance } = req.body;
    
    if (!start || !end) {
        return res.status(400).json({
            success: false,
            message: "Points de départ et d'arrivée requis"
        });
    }

    // Simulation de planification de randonnée avec chemin réaliste
    const distance = Math.random() * 15 + 2;
    const elevationGain = Math.floor(Math.random() * 800 + 100);
    
    // Générer des waypoints pour un chemin de randonnée réaliste
    const waypointsCount = Math.floor(distance / 2) + 3; // Plus de waypoints pour des distances plus longues
    const waypoints = [start];
    
    // Créer des waypoints intermédiaires qui suivent un chemin plus naturel
    for (let i = 1; i < waypointsCount - 1; i++) {
        const progress = i / (waypointsCount - 1);
        
        // Base progression linéaire
        const baseLat = start.lat + (end.lat - start.lat) * progress;
        const baseLng = start.lng + (end.lng - start.lng) * progress;
        
        // Ajouter de la variation pour simuler un chemin de randonnée
        const variation = 0.005; // Variation en degrés
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * variation;
        
        const waypoint = {
            lat: baseLat + Math.cos(angle) * radius,
            lng: baseLng + Math.sin(angle) * radius,
            name: getWaypointName(i, progress),
            elevation: Math.floor(progress * elevationGain * (0.5 + Math.random()))
        };
        
        waypoints.push(waypoint);
    }
    
    waypoints.push(end);
    
    const plannedHike = {
        id: Date.now(),
        start,
        end,
        distance: `${distance.toFixed(1)} km`,
        duration: `${Math.floor(distance / 4)}h ${Math.floor((distance % 4) * 15)}min`,
        elevation: `+${elevationGain}m`,
        difficulty: difficulty || ["easy", "moderate", "hard"][Math.floor(Math.random() * 3)],
        terrain: ["sentier", "rocher", "forêt"][Math.floor(Math.random() * 3)],
        rating: (Math.random() * 2 + 3).toFixed(1),
        waypoints,
        weather: ["sunny", "cloudy", "rainy"][Math.floor(Math.random() * 3)],
        tips: generateHikingTips(distance, elevationGain, difficulty)
    };

function getWaypointName(index, progress) {
    const names = [
        "Croisement de sentiers",
        "Point de vue",
        "Source d'eau",
        "Refuge forestier",
        "Col de montagne",
        "Clairière",
        "Pont de randonnée",
        "Plateau rocheux",
        "Forêt dense",
        "Prairie alpine"
    ];
    
    if (progress < 0.2) return "Début de sentier";
    if (progress > 0.8) return "Approche finale";
    
    return names[index % names.length];
}

function generateHikingTips(distance, elevation, difficulty) {
    const tips = [
        "Emportez suffisamment d'eau (1L par 10km)",
        "Vérifiez la météo avant de partir",
        "Prévenez quelqu'un de votre itinéraire"
    ];
    
    if (distance > 10) {
        tips.push("Prévoyez des collations énergétiques");
    }
    
    if (elevation > 500) {
        tips.push("Attention aux changements d'altitude");
    }
    
    if (difficulty === "hard") {
        tips.push("Équipement de randonnée spécialisé recommandé");
    }
    
    return tips;
}

    res.json({
        success: true,
        data: plannedHike,
        message: "Randonnée planifiée avec succès"
    });
});

module.exports = router;