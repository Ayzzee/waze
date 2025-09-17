// 📊 API Routes pour statistiques
const express = require('express');
const router = express.Router();
const { demoTrails, demoDiscoveries } = require('../data/demo-data');

// Obtenir les statistiques globales de l'application
router.get('/', (req, res) => {
    // Importation dynamique pour éviter les dépendances circulaires
    const users = require('./users');
    
    const stats = {
        totalTrails: demoTrails.length,
        totalDiscoveries: demoDiscoveries.length,
        totalHikers: 0, // Sera mis à jour selon l'implémentation réelle
        popularRegions: [
            { name: "Alpes du Nord", count: 15 },
            { name: "Pyrénées", count: 12 },
            { name: "Vosges", count: 8 },
            { name: "Corse", count: 10 }
        ],
        difficultiesDistribution: {
            easy: 45,
            moderate: 35,
            hard: 20
        }
    };

    res.json({
        success: true,
        data: stats,
        message: "Statistiques récupérées"
    });
});

module.exports = router;