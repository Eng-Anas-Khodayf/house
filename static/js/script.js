// API Configuration
const API_BASE_URL = (typeof window !== 'undefined' && window.location && window.location.origin && window.location.protocol.startsWith('http'))
    ? `${window.location.origin}/api`
    : 'http://127.0.0.1:5000/api';
let isApiConnected = false;

// Map Variables
let map;
let marker;
let miniMap;
let miniMarker;
const CALIFORNIA_BOUNDS = {
    north: 42.0,
    south: 32.5,
    west: -124.5,
    east: -114.0
};

// Sample data for testing (based on California dataset ranges)
const sampleData = {
    median_income: "3.87",
    ocean_proximity: "NEAR BAY",
    latitude: "37.7749",
    longitude: "-122.4194",
    housing_median_age: "41",
    total_rooms: "8802",
    total_bedrooms: "2185",
    population: "3228",
    households: "1267"
};

// DOM Elements
const form = document.getElementById('predictionForm');
const resetBtn = document.getElementById('resetBtn');
const sampleBtn = document.getElementById('sampleBtn');
const resultCard = document.getElementById('resultCard');
const resultContent = document.getElementById('resultContent');
const resultPlaceholder = resultCard.querySelector('.result-placeholder');
const priceValue = document.getElementById('priceValue');
const detailsGrid = document.getElementById('detailsGrid');
const timestamp = document.getElementById('timestamp');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const apiStatus = document.getElementById('apiStatus');
const statusDot = document.getElementById('statusDot');

// Map display elements
const selectedLat = document.getElementById('selectedLat');
const selectedLng = document.getElementById('selectedLng');
const resultLat = document.getElementById('resultLat');
const resultLng = document.getElementById('resultLng');

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    checkApiConnection();
    setupEventListeners();
    initializeMap();
    initializeAutoCalculations();
    
    if (window.location.hash === '#sample') {
        setTimeout(loadSampleData, 1000);
    }
});

function setupEventListeners() {
    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await predictPrice();
    });

    // Reset form
    resetBtn.addEventListener('click', resetForm);

    // Load sample data
    sampleBtn.addEventListener('click', loadSampleData);
    
    // Auto-calculate fields when inputs change
    ['total_rooms', 'total_bedrooms', 'population', 'households'].forEach(id => {
        document.getElementById(id).addEventListener('input', updateCalculatedFields);
    });
}

// Map Functions
function initializeMap() {
    // Initialize main map
    map = L.map('californiaMap').setView([36.7783, -119.4179], 6);
    
    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 12,
        minZoom: 5
    }).addTo(map);
    
    // Set bounds to California
    map.setMaxBounds([
        [CALIFORNIA_BOUNDS.south, CALIFORNIA_BOUNDS.west],
        [CALIFORNIA_BOUNDS.north, CALIFORNIA_BOUNDS.east]
    ]);
    
    // Add initial marker (San Francisco)
    marker = L.marker([37.7749, -122.4194], {
        draggable: true,
        title: "Drag to adjust location"
    }).addTo(map);
    
    marker.bindPopup("Selected location<br>Drag to adjust").openPopup();
    
    // Update coordinates when marker is moved
    marker.on('dragend', function(e) {
        updateCoordinatesFromMarker();
    });
    
    // Add click event to map
    map.on('click', function(e) {
        // Remove existing marker
        if (marker) {
            map.removeLayer(marker);
        }
        
        // Add new marker at clicked location
        marker = L.marker(e.latlng, {
            draggable: true,
            title: "Drag to adjust location"
        }).addTo(map);
        
        marker.bindPopup("Selected location<br>Drag to adjust").openPopup();
        updateCoordinatesFromMarker();
        
        // Update marker event
        marker.on('dragend', function(e) {
            updateCoordinatesFromMarker();
        });
    });
    
    // Add California boundaries layer (optional)
    addCaliforniaBoundaries();
    
    // Initialize mini map for results
    initializeMiniMap();
}

function initializeMiniMap() {
    miniMap = L.map('miniMap').setView([37.7749, -122.4194], 8);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '',
        maxZoom: 12,
        minZoom: 5
    }).addTo(miniMap);
    
    miniMarker = L.marker([37.7749, -122.4194]).addTo(miniMap);
    miniMap.scrollWheelZoom.disable();
    miniMap.dragging.disable();
    miniMap.touchZoom.disable();
    miniMap.doubleClickZoom.disable();
    miniMap.boxZoom.disable();
    miniMap.keyboard.disable();
}

function addCaliforniaBoundaries() {
    // This is a simplified California boundary polygon
    const californiaOutline = [
        [42.0, -124.5],
        [42.0, -114.0],
        [32.5, -114.0],
        [32.5, -124.5]
    ];
    
    L.polygon(californiaOutline, {
        color: '#667eea',
        weight: 2,
        opacity: 0.5,
        fillOpacity: 0.1,
        fillColor: '#667eea'
    }).addTo(map);
}

function updateCoordinatesFromMarker() {
    const lat = marker.getLatLng().lat;
    const lng = marker.getLatLng().lng;
    
    // Update display
    selectedLat.textContent = lat.toFixed(4);
    selectedLng.textContent = lng.toFixed(4);
    
    // Update form fields
    document.getElementById('latitude').value = lat;
    document.getElementById('longitude').value = lng;
    
    // Update results display if open
    resultLat.textContent = lat.toFixed(4);
    resultLng.textContent = lng.toFixed(4);
    
    // Update mini map
    if (miniMap && miniMarker) {
        miniMap.setView([lat, lng], 8);
        miniMarker.setLatLng([lat, lng]);
    }
}

function useCurrentLocation() {
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser");
        return;
    }
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            // Check if location is within California bounds
            if (lat >= CALIFORNIA_BOUNDS.south && lat <= CALIFORNIA_BOUNDS.north &&
                lng >= CALIFORNIA_BOUNDS.west && lng <= CALIFORNIA_BOUNDS.east) {
                
                // Remove existing marker
                if (marker) {
                    map.removeLayer(marker);
                }
                
                // Add new marker
                marker = L.marker([lat, lng], {
                    draggable: true,
                    title: "Your location"
                }).addTo(map);
                
                map.setView([lat, lng], 8);
                updateCoordinatesFromMarker();
                
                showNotification('Your location has been set!', 'success');
            } else {
                alert('Your location is outside California. Please select a location within California bounds.');
            }
        },
        (error) => {
            console.error("Geolocation error:", error);
            alert("Unable to retrieve your location. Please select manually on the map.");
        }
    );
}

// Auto-calculation functions
function initializeAutoCalculations() {
    updateCalculatedFields();
}

function updateCalculatedFields() {
    const totalRooms = parseFloat(document.getElementById('total_rooms').value) || 0;
    const totalBedrooms = parseFloat(document.getElementById('total_bedrooms').value) || 0;
    const population = parseFloat(document.getElementById('population').value) || 0;
    const households = parseFloat(document.getElementById('households').value) || 0;
    
    // Calculate derived fields
    const roomsPerHousehold = households > 0 ? totalRooms / households : 0;
    const bedroomsPerRoom = totalRooms > 0 ? totalBedrooms / totalRooms : 0;
    const populationPerHousehold = households > 0 ? population / households : 0;
    
    // Update readonly fields
    document.getElementById('rooms_per_household').value = roomsPerHousehold.toFixed(2);
    document.getElementById('bedrooms_per_room').value = bedroomsPerRoom.toFixed(3);
    document.getElementById('population_per_household').value = populationPerHousehold.toFixed(2);
}

function loadSampleData() {
    Object.keys(sampleData).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
            element.value = sampleData[key];
        }
    });
    
    // Update map location if sample data has lat/lng
    if (sampleData.latitude && sampleData.longitude) {
        const lat = parseFloat(sampleData.latitude);
        const lng = parseFloat(sampleData.longitude);
        
        if (marker) {
            map.removeLayer(marker);
        }
        
        marker = L.marker([lat, lng], {
            draggable: true,
            title: "Sample location"
        }).addTo(map);
        
        map.setView([lat, lng], 8);
        updateCoordinatesFromMarker();
    }
    
    // Trigger calculations
    updateCalculatedFields();
    
    showNotification('Sample data loaded successfully!', 'success');
}

function resetForm() {
    form.reset();
    hideResult();
    
    // Reset map to default location
    if (marker) {
        map.removeLayer(marker);
    }
    
    marker = L.marker([37.7749, -122.4194], {
        draggable: true,
        title: "Drag to adjust location"
    }).addTo(map);
    
    map.setView([37.7749, -122.4194], 6);
    updateCoordinatesFromMarker();
    updateCalculatedFields();
    
    showNotification('Form has been reset', 'info');
}

async function checkApiConnection() {
    try {
        const response = await fetch(`${API_BASE_URL}/features`);
        if (response.ok) {
            isApiConnected = true;
            apiStatus.textContent = 'API Connected';
            statusDot.className = 'status-dot connected';
        } else {
            throw new Error('API not responding');
        }
    } catch (error) {
        isApiConnected = false;
        apiStatus.textContent = 'API Disconnected';
        statusDot.className = 'status-dot';
        showNotification('Cannot connect to prediction API. Please ensure Flask server is running.', 'error');
    }
}

async function predictPrice() {
    if (!isApiConnected) {
        showError('Cannot connect to prediction API. Please check if the Flask server is running.');
        return;
    }

    // Validate form
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    // Validate location is within California
    const lat = parseFloat(document.getElementById('latitude').value);
    const lng = parseFloat(document.getElementById('longitude').value);
    
    if (lat < CALIFORNIA_BOUNDS.south || lat > CALIFORNIA_BOUNDS.north ||
        lng < CALIFORNIA_BOUNDS.west || lng > CALIFORNIA_BOUNDS.east) {
        showError('Please select a location within California bounds.');
        return;
    }

    // Show loading, hide results and errors
    loading.style.display = 'block';
    errorMessage.style.display = 'none';
    hideResult();

    try {
        // Collect form data
        const formData = new FormData(form);
        const data = {};
        formData.forEach((value, key) => {
            data[key] = value;
        });

        // Send prediction request
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            // Display prediction result
            displayResult(result);
            showNotification('Prediction completed successfully!', 'success');
        } else {
            // Display error from API
            showError(result.error || 'Prediction failed');
        }
    } catch (error) {
        console.error('Prediction error:', error);
        showError('Failed to connect to the server. Please try again.');
    } finally {
        loading.style.display = 'none';
    }
}

function displayResult(result) {
    // Update price display
    priceValue.textContent = result.formatted_price;
    
    // Update location in results
    const lat = parseFloat(result.input_features.latitude);
    const lng = parseFloat(result.input_features.longitude);
    resultLat.textContent = lat.toFixed(4);
    resultLng.textContent = lng.toFixed(4);
    
    // Update mini map
    if (miniMap && miniMarker) {
        miniMap.setView([lat, lng], 8);
        miniMarker.setLatLng([lat, lng]);
    }
    
    // Update details grid
    detailsGrid.innerHTML = '';
    
    Object.entries(result.input_features).forEach(([key, value]) => {
        // Skip auto-calculated fields in display for brevity
        if (key.includes('_per_')) {
            return;
        }
        
        const detailItem = document.createElement('div');
        detailItem.className = 'detail-item';
        
        const label = document.createElement('div');
        label.className = 'detail-label';
        label.textContent = formatLabel(key);
        
        const valueElement = document.createElement('div');
        valueElement.className = 'detail-value';
        valueElement.textContent = value;
        
        detailItem.appendChild(label);
        detailItem.appendChild(valueElement);
        detailsGrid.appendChild(detailItem);
    });
    
    // Add calculated fields
    const calculatedFields = [
        { label: 'Rooms per Household', value: document.getElementById('rooms_per_household').value },
        { label: 'Bedrooms per Room', value: document.getElementById('bedrooms_per_room').value },
        { label: 'Population per Household', value: document.getElementById('population_per_household').value }
    ];
    
    calculatedFields.forEach(field => {
        const detailItem = document.createElement('div');
        detailItem.className = 'detail-item';
        
        const label = document.createElement('div');
        label.className = 'detail-label';
        label.textContent = field.label;
        
        const valueElement = document.createElement('div');
        valueElement.className = 'detail-value';
        valueElement.textContent = field.value;
        
        detailItem.appendChild(label);
        detailItem.appendChild(valueElement);
        detailsGrid.appendChild(detailItem);
    });
    
    // Update timestamp
    const now = new Date();
    timestamp.textContent = `Prediction made on ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}`;
    
    // Show result section
    resultPlaceholder.style.display = 'none';
    resultContent.style.display = 'block';
}

function hideResult() {
    resultPlaceholder.style.display = 'block';
    resultContent.style.display = 'none';
}

function showError(message) {
    errorText.textContent = message;
    errorMessage.style.display = 'block';
}

function formatLabel(key) {
    return key
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function showNotification(message, type = 'info') {
    // Remove existing notification
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    notification.innerHTML = `
        <span>${icon} ${message}</span>
        <button onclick="this.parentElement.remove()">×</button>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1'};
        color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460'};
        border: 1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : '#bee5eb'};
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-width: 300px;
        max-width: 400px;
        animation: slideIn 0.3s ease;
    `;
    
    // Add button styles
    notification.querySelector('button').style.cssText = `
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        padding: 0 5px;
        color: inherit;
    `;
    
    // Add keyframes for animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Make showNotification available globally for the close button
window.showNotification = showNotification;
window.useCurrentLocation = useCurrentLocation;