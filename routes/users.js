// 👤 API Routes pour gestion utilisateurs
const express = require('express');
const router = express.Router();

// Base de données en mémoire pour les utilisateurs
let users = [];

// Enregistrer un nouveau randonneur
router.post('/register', (req, res) => {
    const { username, email, experience } = req.body;
    
    if (!username || !email) {
        return res.status(400).json({
            success: false,
            message: "Nom d'utilisateur et email requis"
        });
    }

    const newHiker = {
        id: Date.now(),
        username,
        email,
        experience: experience || "beginner",
        points: 0,
        level: "Apprenti Randonneur",
        badges: [],
        stats: {
            totalDistance: 0,
            totalElevation: 0,
            hikesCompleted: 0,
            discoveryShared: 0
        },
        joinDate: new Date().toISOString()
    };

    users.push(newHiker);

    res.json({
        success: true,
        data: newHiker,
        message: "Profil randonneur créé"
    });
});

// Obtenir un profil de randonneur par ID
router.get('/:id', (req, res) => {
    const hiker = users.find(u => u.id == req.params.id);
    
    if (!hiker) {
        return res.status(404).json({
            success: false,
            message: "Randonneur non trouvé"
        });
    }

    res.json({
        success: true,
        data: hiker,
        message: "Profil récupéré"
    });
});

module.exports = router;