// 🌤️ API Routes pour météo des sentiers
const express = require('express');
const router = express.Router();

// Obtenir la météo pour une position donnée
router.get('/:lat/:lng', (req, res) => {
    const { lat, lng } = req.params;
    
    // Simulation météo
    const weatherData = {
        location: { lat: parseFloat(lat), lng: parseFloat(lng) },
        current: {
            condition: ["sunny", "cloudy", "rainy", "snowy"][Math.floor(Math.random() * 4)],
            temperature: Math.floor(Math.random() * 25 + 5) + "°C",
            humidity: Math.floor(Math.random() * 40 + 40) + "%",
            wind: Math.floor(Math.random() * 20 + 5) + " km/h",
            visibility: Math.floor(Math.random() * 10 + 5) + " km"
        },
        forecast: [
            {
                day: "Aujourd'hui",
                condition: "sunny",
                temp_min: "8°C",
                temp_max: "18°C",
                precipitation: "0%"
            },
            {
                day: "Demain",
                condition: "cloudy",
                temp_min: "6°C",
                temp_max: "15°C",
                precipitation: "20%"
            },
            {
                day: "Après-demain",
                condition: "rainy",
                temp_min: "4°C",
                temp_max: "12°C",
                precipitation: "80%"
            }
        ],
        alerts: Math.random() > 0.7 ? ["⚠️ Risque d'orage en fin d'après-midi"] : []
    };

    res.json({
        success: true,
        data: weatherData,
        message: "Météo récupérée"
    });
});

module.exports = router;