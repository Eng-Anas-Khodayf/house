# 🏠 California House Price Predictor

[![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-2.0+-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![LightGBM](https://img.shields.io/badge/LightGBM-ML%20Model-FF9900?style=for-the-badge&logo=scikitlearn&logoColor=white)](https://lightgbm.readthedocs.io/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Leaflet](https://img.shields.io/badge/Leaflet-Interactive%20Map-199900?style=for-the-badge&logo=leaflet&logoColor=white)](https://leafletjs.com/)

An end-to-end Machine Learning web application that predicts California median house prices. Built with a **Flask REST API**, a high-performance **LightGBM** gradient boosted regression model, and an interactive **Glassmorphism web interface** featuring dynamic geospatial mapping with Leaflet.js.

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Project Architecture](#-project-architecture)
- [Dataset & Input Features](#-dataset--input-features)
- [Trained Machine Learning Models](#-trained-machine-learning-models)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Installation](#local-installation)
  - [Running with Docker](#running-with-docker)
- [REST API Reference](#-rest-api-reference)
- [User Interface Highlights](#-user-interface-highlights)
- [Author & License](#-author--license)

---

## 🌟 Overview

The **California House Price Predictor** estimates median residential property values across California census block groups. Users can pinpoint exact geographical coordinates using an interactive California map, enter housing and socioeconomic details, and receive instant real-time price valuations.

Derived features (such as rooms per household, bedrooms per room, and population density) are computed automatically on the fly, and geographic bounds validation ensures that all queries correspond to valid California locations.

---

## ✨ Key Features

- 🗺️ **Interactive Geospatial Map (Leaflet.js)**: Click or drag a pin anywhere on the California map to automatically populate latitude and longitude coordinates.
- 📍 **Geolocation Detection**: "Use My Location" button detects coordinates using HTML5 Geolocation with strict boundary checking.
- ⚡ **Real-Time Derived Feature Calculations**: Automatically computes:
  - `Rooms per Household` = `Total Rooms` ÷ `Households`
  - `Bedrooms per Room` = `Total Bedrooms` ÷ `Total Rooms`
  - `Population per Household` = `Population` ÷ `Households`
- 🤖 **Production LightGBM Pipeline**: Serialized LGBM regressor providing sub-millisecond inference and high predictive accuracy.
- 🧪 **1-Click Sample Data**: Preloads realistic California district values (San Francisco area) to test predictions immediately.
- 💎 **Modern Glassmorphism UI**: Frosted glass elements, animated ambient background orbs, responsive layouts, Font Awesome icons, and Poppins typography.
- 🛡️ **Comprehensive Validation**: Strict input boundary validation (Latitude: 32.5° to 42.0°, Longitude: -124.5° to -114.0°) and categorical encoding verification.
- 🐳 **Docker Containerization**: Includes multi-stage ready `Dockerfile` configured with OpenMP runtime (`libgomp1`) for high-concurrency ML serving.

---

## 🏗️ Project Architecture

```
┌───────────────────────────────────────────────────────────┐
│                     Client (Browser)                      │
│   • Leaflet.js Interactive Map (Lat/Lng Picker)           │
│   • Glassmorphism Form & Real-Time Ratio Calculators     │
│   • Asynchronous Fetch API & Mini Map Result Visualizer   │
└─────────────────────────────┬─────────────────────────────┘
                              │ HTTP / JSON
                              ▼
┌───────────────────────────────────────────────────────────┐
│                   Flask Backend (app.py)                  │
│   • Static & HTML Template Serving                        │
│   • CORS-enabled REST API Endpoints                       │
│   • Geographic Bounds & Input Feature Validation          │
│   • Categorical Encoding (Ocean Proximity Mapping)        │
└─────────────────────────────┬─────────────────────────────┘
                              │ Preprocessed Vector (12 Features)
                              ▼
┌───────────────────────────────────────────────────────────┐
│              Inference Engine (Joblib / NumPy)            │
│   • Primary Model: LightGBM_housing_model.pkl             │
│   • Alternative: xgboost_housing_model.pkl                │
│   • Alternative: RandomForest_housing_model.pkl           │
└───────────────────────────────────────────────────────────┘
```

---

## 📊 Dataset & Input Features

The model is trained on the benchmark **California Housing Dataset** (based on the 1990 U.S. Census). 

### Primary Input Attributes

| Attribute | Data Type | Description | Example Range |
| :--- | :--- | :--- | :--- |
| `latitude` | Float | Geographic latitude (selected on map) | `32.5` to `42.0` |
| `longitude` | Float | Geographic longitude (selected on map) | `-124.5` to `-114.0` |
| `median_income` | Float | Median household income in tens of thousands (e.g. 3.87 = $38,700) | `0.5` to `15.0+` |
| `housing_median_age` | Integer | Median age of housing structures in the block group | `1` to `52` years |
| `total_rooms` | Integer | Total count of rooms across all houses in the block | `100` to `30,000+` |
| `total_bedrooms` | Integer | Total count of bedrooms in the block | `50` to `6,000+` |
| `population` | Integer | Total residents residing in the block | `100` to `35,000+` |
| `households` | Integer | Total number of households / family units | `50` to `5,000+` |
| `ocean_proximity` | String | Proximity category to the Pacific coast | See categories below |

### Ocean Proximity Encodings

| Category | Encoded Integer | Description |
| :--- | :---: | :--- |
| `NEAR BAY` | `0` | Bay Area (e.g., San Francisco Bay) |
| `<1H OCEAN` | `1` | Less than one hour from the ocean |
| `INLAND` | `2` | Inland valleys and interior regions |
| `NEAR OCEAN` | `3` | Directly adjacent to the ocean coastline |
| `ISLAND` | `4` | Island locations (e.g., Channel Islands) |

### Auto-Calculated Engineered Features

These ratios reflect housing density and living standards:
- **`rooms_per_household`** = `total_rooms` / `households`
- **`bedrooms_per_room`** = `total_bedrooms` / `total_rooms`
- **`population_per_household`** = `population` / `households`

---

## 🤖 Trained Machine Learning Models

The `models/` directory includes serialized models trained for this regression task:

| Model File | Algorithm | Framework | Size | Status |
| :--- | :--- | :--- | :---: | :--- |
| `LightGBM_housing_model.pkl` | Light Gradient Boosting Machine | LightGBM / Scikit-Learn | ~1.4 MB | **Active (Production Default)** |
| `xgboost_housing_model.pkl` | Extreme Gradient Boosting Pipeline | XGBoost / Scikit-Learn | ~2.2 MB | Available alternative |
| `RandomForest_housing_model.pkl`| Random Forest Regressor Ensemble | Scikit-Learn | ~42.6 MB | Available alternative |

> **Why LightGBM?**  
> LightGBM delivers tree-based leaf-wise gradient boosting that combines superior accuracy with low inference latency and a compact model footprint (~1.4 MB), making it ideal for web deployment.

---

## 📁 Project Structure

```
├── models/
│   ├── LightGBM_housing_model.pkl       # Primary LightGBM model artifact
│   ├── RandomForest_housing_model.pkl   # Pre-trained Random Forest model
│   └── xgboost_housing_model.pkl        # Pre-trained XGBoost pipeline model
├── static/
│   ├── css/
│   │   └── style.css                    # Glassmorphism design & animations
│   └── js/
│       └── script.js                    # Leaflet map logic & client-side API calls
├── templates/
│   └── index.html                       # Responsive HTML5 web application template
├── app.py                               # Flask backend application & prediction API
├── Dockerfile                           # Container configuration for containerized deployment
├── requirements.txt                     # Python packages and dependency requirements
├── .gitignore                           # Git ignore rules
└── README.md                            # Comprehensive project documentation
```

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.9+**
- **pip** (Python package installer)
- *(Optional)* **Docker**

---

### Local Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Eng-Anas-Khodayf/Claifornia_Home_Price.git
   cd Claifornia_Home_Price
   ```

2. **Create and activate a virtual environment:**

   - **Windows (PowerShell):**
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```

   - **Windows (Command Prompt):**
     ```cmd
     python -m venv venv
     venv\Scripts\activate.bat
     ```

   - **Linux / macOS:**
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. **Install dependencies:**
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

4. **Run the Flask application:**
   ```bash
   python app.py
   ```

5. **Access the application:**  
   Open your browser and navigate to:  
   👉 **`http://127.0.0.1:5000`**

---

### Running with Docker

The application includes a `Dockerfile` with the OpenMP runtime (`libgomp1`) pre-installed for LightGBM.

1. **Build the Docker image:**
   ```bash
   docker build -t california-house-predictor .
   ```

2. **Run the Docker container:**
   ```bash
   docker run -d -p 5005:5005 --name house-predictor california-house-predictor
   ```

3. **Open the application:**  
   Navigate to **`http://localhost:5005`** in your browser.

---

## 🔌 REST API Reference

The Flask application exposes REST endpoints that can be integrated into external services or scripts:

### 1. API Health & Status
- **Endpoint**: `GET /api`
- **Description**: Returns API health, supported endpoints, and geographic bounding coordinates.
- **Sample Response**:
  ```json
  {
    "california_bounds": {
      "max_lat": 42.0,
      "max_lng": -114.0,
      "min_lat": 32.5,
      "min_lng": -124.5
    },
    "endpoints": {
      "/api/features": "GET - Get feature information",
      "/api/predict": "POST - Make predictions"
    },
    "message": "California House Price Prediction API",
    "status": "active"
  }
  ```

---

### 2. Feature Metadata & Options
- **Endpoint**: `GET /api/features`
- **Description**: Returns available ocean proximity choices, descriptions of all required features, and benchmark reference cities.

---

### 3. Make House Price Prediction
- **Endpoint**: `POST /api/predict`
- **Content-Type**: `application/json`

#### Example Request (`cURL`):

```bash
curl -X POST http://127.0.0.1:5000/api/predict \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 37.7749,
    "longitude": -122.4194,
    "median_income": 3.87,
    "housing_median_age": 41,
    "total_rooms": 8802,
    "total_bedrooms": 2185,
    "population": 3228,
    "households": 1267,
    "ocean_proximity": "NEAR BAY",
    "rooms_per_household": 6.95,
    "bedrooms_per_room": 0.248,
    "population_per_household": 2.55
  }'
```

#### Example Success Response (`200 OK`):

```json
{
  "status": "success",
  "predicted_price": 452130.45,
  "formatted_price": "$452,130.45",
  "location": {
    "latitude": 37.7749,
    "longitude": -122.4194
  },
  "input_features": {
    "bedrooms_per_room": 0.248,
    "households": 1267,
    "housing_median_age": 41,
    "latitude": 37.7749,
    "longitude": -122.4194,
    "median_income": 3.87,
    "ocean_proximity": "NEAR BAY",
    "population": 3228,
    "population_per_household": 2.55,
    "rooms_per_household": 6.95,
    "total_bedrooms": 2185,
    "total_rooms": 8802
  }
}
```

#### Error Handling:
- Returns `400 Bad Request` if mandatory fields are missing, if coordinates fall outside California bounds, or if the ocean proximity category is invalid.
- Returns `500 Internal Server Error` if the model artifact fails to process input data.

---

## 🎨 User Interface Highlights

- **Visual Coordinate Selector**: Pan and zoom across the California map; dragging or clicking automatically updates latitude and longitude fields.
- **Dynamic Derived Calculations**: Form fields immediately recalculate household ratios as room, bedroom, population, or household counts change.
- **Interactive Result Card**: Displays formatted currency valuations, updates a location confirmation mini-map, and provides a breakdown of all input parameters.
- **Heartbeat Status Indicator**: Real-time connection badge verifying API availability directly in the footer.

---

## 👤 Author

**Eng. Anas Khodayf**
- GitHub: [@Eng-Anas-Khodayf](https://github.com/Eng-Anas-Khodayf)
- Repository: [Claifornia_Home_Price](https://github.com/Eng-Anas-Khodayf/Claifornia_Home_Price)

---

## 📄 License

This project is open-source and available under the [MIT License](https://opensource.org/licenses/MIT).
