#!/bin/bash
echo "Create data directory"
mkdir -p data
echo "Retrieve datasets"
wget -N -P data/ http://etalab-datasets.geo.data.gouv.fr/contours-administratifs/2021/geojson/communes-heavy-simplified.geojson.gz
wget -N -P data/ http://etalab-datasets.geo.data.gouv.fr/contours-administratifs/2021/geojson/communes-light-simplified.geojson.gz
echo "Completed"
