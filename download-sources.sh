#!/bin/bash
echo "Create data directory"
mkdir -p data
echo "Retrieve datasets"
wget -N -P data/ http://etalab-datasets.geo.data.gouv.fr/contours-administratifs/2022/geojson/communes-5m.geojson.gz
wget -N -P data/ http://etalab-datasets.geo.data.gouv.fr/contours-administratifs/2022/geojson/communes-50m.geojson.gz
echo "Completed"
