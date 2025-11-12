🌏Google Earth Engine Scripts – Environmental Variable Processing

📌 Overview
This repository contains a collection of Google Earth Engine (GEE) scripts used for processing environmental variables related to habitat suitability modeling and spatial analysis in Kalimantan, Indonesia.
Each script represents a specific environmental parameter that supports spatial modeling and analysis using the Maximum Entropy (MaxEnt) approach.

🧩 Included Scripts
- DEM.js----Extracts and processes elevation data from digital elevation models (DEM) to analyze terrain characteristics.
- NDVI.js---Computes the Normalized Difference Vegetation Index (NDVI) to represent vegetation density and greenness.
- Annual Mean Temperature.js----Retrieves and visualizes long-term mean temperature data across Kalimantan.
- Rainfall (Annual Precipitation).js----Calculates total annual precipitation derived from global climate datasets.

🗺️ Study Area
The scripts are focused on East Kalimantan (Borneo) Province, supporting research on the spatial distribution of Bekantan (Nasalis larvatus) and other environmental modeling projects.

⚙️ How to Use
1. Open Google Earth Engine Code Editor
2. Copy the desired script’s code from this repository.
3. Paste it into your GEE editor and run it. Adjust the region of interest based on you'r own ROI preferences. 
4. Adjust dataset paths (ee.ImageCollection, ee.FeatureCollection, etc.) as needed.
5. Adjust data catalog filter date (especially NDVI).
6. Most of script's are using Google Earth Engine 'Assets' so make sure to import and add your own shapefile ROI dataset to your GEE account. 
