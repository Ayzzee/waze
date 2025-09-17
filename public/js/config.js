// Configuration OpenRouteService avec ta clé
const ORS_API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjdlMDg1MzQyOGEzYTQ3ZWY5YjJiMjgzNGYxNmFlNDhjIiwiaCI6Im11cm11cjY0In0=';
const ORS_BASE_URL = 'https://api.openrouteservice.org';
const API_BASE = 'http://localhost:3000/api';

// Variables globales HiKe
let map;
let currentTrail = null;
let currentHiker = null;
let activeHike = false;
let userLocation = null;
let routeLayer = null;
let markersLayer = null;
let discoveryLayer = null;
let weatherLayer = null;
let selectedDiscoveryType = null;
let mapStyle = 'outdoor';
let hikeStartTime = null;
let hikeTimer = null;

// Types de découvertes avec couleurs
const discoveryTypes = {
    wildlife: { icon: 'fas fa-paw', color: '#10b981', name: 'Faune' },
    viewpoint: { icon: 'fas fa-binoculars', color: '#0ea5e9', name: 'Point de vue' },
    waterfall: { icon: 'fas fa-tint', color: '#06b6d4', name: 'Cascade' },
    cave: { icon: 'fas fa-mountain', color: '#6b7280', name: 'Grotte' },
    flora: { icon: 'fas fa-leaf', color: '#22c55e', name: 'Flore' },
    danger: { icon: 'fas fa-exclamation-triangle', color: '#ef4444', name: 'Danger' }
};