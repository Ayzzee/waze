const express = require('express');
const cors = require('cors');
const path = require('path');

// Import des modules de routes
const trailsRoutes = require('./routes/trails');
const discoveriesRoutes = require('./routes/discoveries');
const weatherRoutes = require('./routes/weather');
const usersRoutes = require('./routes/users');
const statsRoutes = require('./routes/stats');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Base de données en mémoire
let trails = [];
let discoveries = [];
let weather = [];

// Configuration des routes API
app.use('/api/trails', trailsRoutes);
app.use('/api/discoveries', discoveriesRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/hikers', usersRoutes);
app.use('/api/stats', statsRoutes);

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