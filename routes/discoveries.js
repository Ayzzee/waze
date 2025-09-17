// 🔍 API Routes pour découvertes et signalements
const express = require('express');
const router = express.Router();
const { demoDiscoveries } = require('../data/demo-data');

// Obtenir la liste des découvertes avec filtres optionnels
router.get('/', (req, res) => {
    const { type, difficulty } = req.query;
    let filteredDiscoveries = [...demoDiscoveries];

    if (type) {
        filteredDiscoveries = filteredDiscoveries.filter(d => d.type === type);
    }
    if (difficulty) {
        filteredDiscoveries = filteredDiscoveries.filter(d => d.difficulty === difficulty);
    }

    res.json({
        success: true,
        data: filteredDiscoveries,
        message: "Découvertes récupérées"
    });
});

// Ajouter une nouvelle découverte
router.post('/', (req, res) => {
    const { type, location, title, description, photos } = req.body;
    
    if (!type || !location || !title) {
        return res.status(400).json({
            success: false,
            message: "Type, localisation et titre requis"
        });
    }

    const newDiscovery = {
        id: Date.now(),
        type,
        location,
        title,
        description: description || '',
        photos: photos || [],
        timestamp: new Date().toISOString(),
        votes: 0,
        author: "Randonneur"
    };

    demoDiscoveries.push(newDiscovery);

    res.json({
        success: true,
        data: newDiscovery,
        message: "Découverte partagée avec succès"
    });
});

module.exports = router;