// Données de démonstration pour l'application HiKe

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

module.exports = {
    demoTrails,
    demoDiscoveries
};