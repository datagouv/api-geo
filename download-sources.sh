#!/bin/bash
YEAR=${YEAR:-2025}
COMMUNES_ASSOCIEES_DELEGUEES=${COMMUNES_ASSOCIEES_DELEGUEES:-NO}
echo "Create data directory"
mkdir -p data
echo "Retrieve datasets"
wget -N -P data/ https://files.data.gouv.fr/dinum-datasets-geo/contours-administratifs/${YEAR}/geojson/communes-5m.geojson.gz
wget -N -P data/ https://files.data.gouv.fr/dinum-datasets-geo/contours-administratifs/${YEAR}/geojson/communes-50m.geojson.gz
if [ "$COMMUNES_ASSOCIEES_DELEGUEES" != "NO" ]; then
    wget -N -P data/ https://files.data.gouv.fr/dinum-datasets-geo/contours-administratifs/${YEAR}/geojson/communes-associees-deleguees-5m.geojson.gz
    wget -N -P data/ https://files.data.gouv.fr/dinum-datasets-geo/contours-administratifs/${YEAR}/geojson/communes-associees-deleguees-50m.geojson.gz
fi
wget -N -P data/ https://files.data.gouv.fr/dinum-datasets-geo/contours-administratifs/${YEAR}/geojson/mairies.geojson.gz
wget -N -P data/ https://files.data.gouv.fr/dinum-datasets-geo/contours-administratifs/${YEAR}/geojson/epci-5m.geojson.gz
wget -N -P data/ https://files.data.gouv.fr/dinum-datasets-geo/contours-administratifs/${YEAR}/geojson/epci-50m.geojson.gz
echo "Completed"
