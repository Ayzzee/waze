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
    
    // Génération améliorée de waypoints pour un chemin de randonnée réaliste
    const waypointsCount = Math.floor(distance / 1.5) + 4; // Plus de waypoints pour plus de réalisme
    const waypoints = [start];
    
    // Créer des waypoints intermédiaires qui suivent un chemin plus naturel
    for (let i = 1; i < waypointsCount - 1; i++) {
        const progress = i / (waypointsCount - 1);
        
        // Base progression avec courbe naturelle (s-curve)
        const curvedProgress = 0.5 * (1 + Math.sin(Math.PI * (progress - 0.5)));
        const baseLat = start.lat + (end.lat - start.lat) * progress;
        const baseLng = start.lng + (end.lng - start.lng) * progress;
        
        // Variation en fonction du terrain et de la progression
        let variationRadius;
        if (progress < 0.3 || progress > 0.7) {
            // Début et fin : plus près des sentiers principaux
            variationRadius = 0.002;
        } else {
            // Milieu : exploration plus libre
            variationRadius = 0.005;
        }
        
        // Ajouter un facteur d'élévation pour simuler le suivi des courbes de niveau
        const elevationFactor = Math.sin(progress * Math.PI * 2) * variationRadius * 0.5;
        
        // Créer une variation plus naturelle qui évite les lignes droites
        const angle1 = progress * Math.PI * 3; // Oscillation principale
        const angle2 = progress * Math.PI * 7; // Oscillation secondaire pour la rugosité
        
        const offsetLat = Math.cos(angle1) * variationRadius + Math.sin(angle2) * variationRadius * 0.3;
        const offsetLng = Math.sin(angle1) * variationRadius + Math.cos(angle2) * variationRadius * 0.3;
        
        const waypoint = {
            lat: baseLat + offsetLat + elevationFactor,
            lng: baseLng + offsetLng,
            name: getRealisticWaypointName(i, progress, distance),
            elevation: Math.floor(start.elevation || 0 + progress * elevationGain * (0.7 + Math.random() * 0.6)),
            terrain: getTerrainType(progress, distance)
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

function getRealisticWaypointName(index, progress, distance) {
    // Noms basés sur la progression et la distance
    const startNames = [
        "Départ du sentier",
        "Panneau d'information",
        "Parking randonneurs"
    ];
    
    const earlyNames = [
        "Premier lacet",
        "Sortie de forêt",
        "Croisement balisé",
        "Passerelle en bois",
        "Première montée"
    ];
    
    const midNames = [
        "Point de vue panoramique",
        "Refuge de montagne",
        "Col intermédiaire",
        "Source naturelle",
        "Plateau herbeux",
        "Crête rocheuse",
        "Vallée cachée",
        "Cascades",
        "Lac de montagne",
        "Cirque glaciaire"
    ];
    
    const lateNames = [
        "Dernière montée",
        "Approche du sommet",
        "Crête finale",
        "Descente technique"
    ];
    
    const endNames = [
        "Arrivée",
        "Sommet",
        "Point culminant"
    ];
    
    if (progress < 0.1) return startNames[index % startNames.length];
    if (progress < 0.3) return earlyNames[index % earlyNames.length];
    if (progress < 0.7) return midNames[index % midNames.length];
    if (progress < 0.9) return lateNames[index % lateNames.length];
    return endNames[index % endNames.length];
}

function getTerrainType(progress, distance) {
    const terrainTypes = [];
    
    // Début : souvent plus facile
    if (progress < 0.3) {
        terrainTypes.push("sentier", "forêt", "chemin");
    }
    
    // Milieu : plus varié selon la distance
    if (progress >= 0.3 && progress <= 0.7) {
        if (distance > 8) {
            terrainTypes.push("rocher", "crête", "col", "haute_montagne");
        } else {
            terrainTypes.push("prairie", "colline", "sous_bois");
        }
    }
    
    // Fin : dépend du type de randonnée
    if (progress > 0.7) {
        if (distance > 10) {
            terrainTypes.push("sommet", "arête", "rocher");
        } else {
            terrainTypes.push("retour", "descente", "sentier");
        }
    }
    
    return terrainTypes[Math.floor(Math.random() * terrainTypes.length)] || "sentier";
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