// Minimal Leaflet implementation for development
window.L = {
    map: function(id, options) {
        const container = document.getElementById(id);
        if (!container) return null;
        
        const map = {
            _container: container,
            _center: [46.2276, 2.2137],
            _zoom: 6,
            _layers: new Set(),
            
            setView: function(center, zoom) {
                this._center = center;
                this._zoom = zoom;
                this._render();
                return this;
            },
            
            _render: function() {
                this._container.innerHTML = `
                    <div style="width: 100%; height: 100%; background: linear-gradient(135deg, #065f46 0%, #059669 50%, #10b981 100%); 
                                position: relative; display: flex; align-items: center; justify-content: center; color: white; 
                                font-size: 18px; text-align: center; border-radius: 12px;">
                        <div>
                            <i class="fas fa-map-marked-alt" style="font-size: 48px; margin-bottom: 10px; display: block;"></i>
                            <div>Carte HiKe</div>
                            <div style="font-size: 14px; opacity: 0.8; margin-top: 5px;">
                                Centre: ${this._center[0].toFixed(2)}, ${this._center[1].toFixed(2)}
                            </div>
                            <div style="font-size: 14px; opacity: 0.8;">Zoom: ${this._zoom}</div>
                        </div>
                    </div>
                `;
            },
            
            on: function(event, callback) {
                if (event === 'click') {
                    this._container.addEventListener('click', (e) => {
                        const rect = this._container.getBoundingClientRect();
                        const lat = this._center[0] + (Math.random() - 0.5) * 0.01;
                        const lng = this._center[1] + (Math.random() - 0.5) * 0.01;
                        callback({ latlng: { lat, lng } });
                    });
                }
                return this;
            },
            
            locate: function(options) {
                // Mock location found
                setTimeout(() => {
                    if (window.onLocationFound) {
                        window.onLocationFound({
                            latlng: { lat: 46.2276, lng: 2.2137 },
                            accuracy: 100
                        });
                    }
                }, 1000);
                return this;
            },
            
            hasLayer: function(layer) {
                return this._layers.has(layer);
            },
            
            addLayer: function(layer) {
                this._layers.add(layer);
                return this;
            },
            
            removeLayer: function(layer) {
                this._layers.delete(layer);
                return this;
            }
        };
        
        map._render();
        return map;
    },
    
    tileLayer: function(url, options) {
        return {
            addTo: function(map) {
                return this;
            }
        };
    },
    
    layerGroup: function() {
        return {
            addTo: function(map) {
                return this;
            },
            clearLayers: function() {
                return this;
            }
        };
    },
    
    marker: function(latlng, options) {
        return {
            addTo: function(layer) {
                return this;
            },
            bindPopup: function(content) {
                return this;
            }
        };
    },
    
    circle: function(latlng, options) {
        return {
            addTo: function(layer) {
                return this;
            }
        };
    },
    
    polyline: function(latlngs, options) {
        return {
            addTo: function(layer) {
                return this;
            }
        };
    }
};

console.log('✅ Leaflet mock loaded successfully');