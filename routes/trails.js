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

    // Simulation de planification de randonnée
    const plannedHike = {
        id: Date.now(),
        start,
        end,
        distance: `${(Math.random() * 15 + 2).toFixed(1)} km`,
        duration: `${Math.floor(Math.random() * 5 + 1)}h ${Math.floor(Math.random() * 60)}min`,
        elevation: `+${Math.floor(Math.random() * 800 + 100)}m`,
        difficulty: difficulty || ["easy", "moderate", "hard"][Math.floor(Math.random() * 3)],
        terrain: ["sentier", "rocher", "forêt"][Math.floor(Math.random() * 3)],
        rating: (Math.random() * 2 + 3).toFixed(1),
        waypoints: [
            start,
            { 
                lat: (start.lat + end.lat) / 2 + (Math.random() - 0.5) * 0.01, 
                lng: (start.lng + end.lng) / 2 + (Math.random() - 0.5) * 0.01,
                name: "Point de passage"
            },
            end
        ],
        weather: ["sunny", "cloudy", "rainy"][Math.floor(Math.random() * 3)],
        tips: [
            "Emportez suffisamment d'eau",
            "Vérifiez la météo avant de partir",
            "Prévenez quelqu'un de votre itinéraire"
        ]
    };

    res.json({
        success: true,
        data: plannedHike,
        message: "Randonnée planifiée avec succès"
    });
});

module.exports = router;