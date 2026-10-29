from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import numpy as np
import joblib
import os

app = Flask(__name__)
CORS(app)

# Load the model
try:
    model = joblib.load("models/LightGBM_housing_model.pkl")
    print("✅ Model loaded successfully")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    model = None

# Mapping for ocean proximity
OCEAN_PROXIMITY_MAPPING = {
    'NEAR BAY': 0,
    '<1H OCEAN': 1,
    'INLAND': 2,
    'NEAR OCEAN': 3,
    'ISLAND': 4
}

# California bounds for validation
CALIFORNIA_BOUNDS = {
    'min_lat': 32.5,
    'max_lat': 42.0,
    'min_lng': -124.5,
    'max_lng': -114.0
}

# Serve the main page
@app.route('/')
def serve_index():
    return send_from_directory('templates', 'index.html')

# Serve static files
@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)

@app.route('/api')
def api_info():
    return jsonify({
        "message": "California House Price Prediction API",
        "status": "active",
        "endpoints": {
            "/api/predict": "POST - Make predictions",
            "/api/features": "GET - Get feature information"
        },
        "california_bounds": CALIFORNIA_BOUNDS
    })

@app.route('/api/predict', methods=['POST'])
def predict():
    if model is None:
        return jsonify({"error": "Model not loaded"}), 500
    
    try:
        # Get JSON data from request
        data = request.json
        
        # Validate required fields
        required_fields = [
            'median_income', 'ocean_proximity', 'population_per_household',
            'latitude', 'housing_median_age', 'longitude',
            'rooms_per_household', 'bedrooms_per_room',
            'households', 'total_bedrooms', 'population', 'total_rooms'
        ]
        
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing field: {field}"}), 400
        
        # Validate ocean proximity
        ocean_proximity = data['ocean_proximity'].upper()
        if ocean_proximity not in OCEAN_PROXIMITY_MAPPING:
            valid_options = list(OCEAN_PROXIMITY_MAPPING.keys())
            return jsonify({
                "error": f"Invalid ocean proximity. Valid options: {valid_options}"
            }), 400
        
        # Validate California bounds
        try:
            lat = float(data['latitude'])
            lng = float(data['longitude'])
            
            if (lat < CALIFORNIA_BOUNDS['min_lat'] or lat > CALIFORNIA_BOUNDS['max_lat'] or
                lng < CALIFORNIA_BOUNDS['min_lng'] or lng > CALIFORNIA_BOUNDS['max_lng']):
                return jsonify({
                    "error": f"Location outside California bounds. Valid range: Latitude {CALIFORNIA_BOUNDS['min_lat']}-{CALIFORNIA_BOUNDS['max_lat']}, Longitude {CALIFORNIA_BOUNDS['min_lng']}-{CALIFORNIA_BOUNDS['max_lng']}"
                }), 400
        except ValueError:
            return jsonify({"error": "Invalid latitude or longitude format"}), 400
        
        # Prepare input data
        ocean_proximity_encoded = OCEAN_PROXIMITY_MAPPING[ocean_proximity]
        
        input_data = np.array([[
            float(data['median_income']),
            ocean_proximity_encoded,
            float(data['population_per_household']),
            lat,
            float(data['housing_median_age']),
            lng,
            float(data['rooms_per_household']),
            float(data['bedrooms_per_room']),
            float(data['households']),
            float(data['total_bedrooms']),
            float(data['population']),
            float(data['total_rooms'])
        ]])
        
        # Make prediction
        prediction = model.predict(input_data)[0]
        
        return jsonify({
            "predicted_price": float(prediction),
            "formatted_price": f"${prediction:,.2f}",
            "status": "success",
            "input_features": data,
            "location": {
                "latitude": lat,
                "longitude": lng
            }
        })
        
    except ValueError as e:
        return jsonify({"error": f"Invalid input value: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500

@app.route('/api/features', methods=['GET'])
def get_features():
    return jsonify({
        "ocean_proximity_options": list(OCEAN_PROXIMITY_MAPPING.keys()),
        "california_bounds": CALIFORNIA_BOUNDS,
        "features_description": {
            "median_income": "Median income of households in the area (in tens of thousands)",
            "ocean_proximity": "Proximity to the ocean (see options)",
            "population_per_household": "Average population per household (auto-calculated)",
            "latitude": "Geographic latitude (select from map)",
            "housing_median_age": "Median age of houses in the area",
            "longitude": "Geographic longitude (select from map)",
            "rooms_per_household": "Average number of rooms per household (auto-calculated)",
            "bedrooms_per_room": "Ratio of bedrooms to total rooms (auto-calculated)",
            "households": "Number of households in the area",
            "total_bedrooms": "Total number of bedrooms in the area",
            "population": "Total population in the area",
            "total_rooms": "Total number of rooms in the area"
        },
        "dataset_info": {
            "source": "California Housing Dataset",
            "location_range": "Latitude: 32.5° to 42.0°, Longitude: -124.5° to -114.0°",
            "sample_locations": {
                "San Francisco": {"lat": 37.7749, "lng": -122.4194},
                "Los Angeles": {"lat": 34.0522, "lng": -118.2437},
                "San Diego": {"lat": 32.7157, "lng": -117.1611},
                "Sacramento": {"lat": 38.5816, "lng": -121.4944}
            }
        }
    })
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', debug=False, port=port)