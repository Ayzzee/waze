const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Base de données en mémoire
let users = [];
let trails = [];
let discoveries = [];
let weather = [];

// Données de démonstration pour randonnées
const demoTrails = [
    {
        id: 1,
        name: "Sentier des Crêtes",
        difficulty: "moderate",
        distance: "8.5 km",
        duration: "3h 30min",
        elevation: "+450m",
        rating: 4.8,
        location: { lat: 45.8566, lng: 6.3522, region: "Alpes du Nord" },
        description: "Magnifique randonnée avec vue panoramique sur le Mont Blanc",
        tags: ["montagne", "panorama", "crêtes"],
        weather: "sunny",
        waypoints: [
            { lat: 45.8566, lng: 6.3522, name: "Départ parking" },
            { lat: 45.8600, lng: 6.3550, name: "Refuge des Crêtes" },
            { lat: 45.8650, lng: 6.3600, name: "Point de vue" }
        ]
    },
    {
        id: 2,
        name: "Forêt des Lutins",
        difficulty: "easy",
        distance: "4.2 km",
        duration: "1h 45min",
        elevation: "+150m",
        rating: 4.5,
        location: { lat: 48.1566, lng: 2.1522, region: "Forêt de Fontainebleau" },
        description: "Balade familiale à travers une forêt enchantée",
        tags: ["forêt", "famille", "facile"],
        weather: "cloudy",
        waypoints: [
            { lat: 48.1566, lng: 2.1522, name: "Entrée forêt" },
            { lat: 48.1600, lng: 2.1550, name: "Clairière des lutins" },
            { lat: 48.1650, lng: 2.1580, name: "Rocher aux fées" }
        ]
    },
    {
        id: 3,
        name: "Canyon Sauvage",
        difficulty: "hard",
        distance: "12.8 km",
        duration: "6h 15min",
        elevation: "+850m",
        rating: 4.9,
        location: { lat: 43.9566, lng: 4.7522, region: "Gorges du Verdon" },
        description: "Randonnée technique dans les gorges spectaculaires",
        tags: ["canyon", "technique", "aventure"],
        weather: "sunny",
        waypoints: [
            { lat: 43.9566, lng: 4.7522, name: "Point Sublime" },
            { lat: 43.9600, lng: 4.7550, name: "Belvédère" },
            { lat: 43.9650, lng: 4.7580, name: "Fond du canyon" }
        ]
    }
];

const demoDiscoveries = [
    {
        id: 1,
        type: "wildlife",
        location: { lat: 45.8580, lng: 6.3540 },
        title: "Famille de marmottes observée",
        description: "Groupe de marmottes près du sentier",
        difficulty: "moderate",
        timestamp: new Date().toISOString(),
        photos: ["🐹"],
        votes: 12
    },
    {
        id: 2,
        type: "viewpoint",
        location: { lat: 48.1580, lng: 2.1540 },
        title: "Point de vue secret sur la vallée",
        description: "Vue magnifique découverte hors sentier",
        difficulty: "easy",
        timestamp: new Date().toISOString(),
        photos: ["🏔️"],
        votes: 8
    },
    {
        id: 3,
        type: "danger",
        location: { lat: 43.9580, lng: 4.7540 },
        title: "⚠️ Passage glissant après pluie",
        description: "Attention aux rochers mouillés, équipement recommandé",
        difficulty: "hard",
        timestamp: new Date().toISOString(),
        photos: ["⚠️"],
        votes: 15
    }
];

// 🥾 API Routes pour randonnées
app.get('/api/trails', (req, res) => {
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

app.get('/api/trails/:id', (req, res) => {
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

app.post('/api/trails/plan', (req, res) => {
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

// 🔍 Découvertes et signalements
app.get('/api/discoveries', (req, res) => {
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

app.post('/api/discoveries', (req, res) => {
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

// 🌤️ Météo des sentiers
app.get('/api/weather/:lat/:lng', (req, res) => {
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

// 👤 Gestion utilisateurs
app.post('/api/hikers/register', (req, res) => {
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

app.get('/api/hikers/:id', (req, res) => {
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

// 📊 Statistiques
app.get('/api/stats', (req, res) => {
    const stats = {
        totalTrails: demoTrails.length,
        totalDiscoveries: demoDiscoveries.length,
        totalHikers: users.length,
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

// Route principale
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`🥾 HiKe Server démarré sur http://localhost:${PORT}`);
    console.log(`🏔️ API disponible sur http://localhost:${PORT}/api`);
    console.log(`📱 Ouvrez sur mobile pour la meilleure expérience !`);
});