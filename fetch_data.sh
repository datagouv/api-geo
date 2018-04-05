#!/bin/bash
GEOAPI_DATA_BASE_URL=https://storage.gra1.cloud.ovh.net/v1/AUTH_a9f396d3ab3e49838ec561c23de6c669/geoapi-data
echo "Create data directory"
mkdir -p data
echo "Retrieve datasets"
wget -N -P data/ $GEOAPI_DATA_BASE_URL/communes/laposte_hexasmal_2017.json
wget -N -P data/ $GEOAPI_DATA_BASE_URL/communes/communes-dp25-20180101.geojson.gz
wget -N -P data/ $GEOAPI_DATA_BASE_URL/communes/France2018.txt
wget -N -P data/ $GEOAPI_DATA_BASE_URL/communes/depts2018.txt
wget -N -P data/ $GEOAPI_DATA_BASE_URL/communes/reg2018.txt
wget -N -P data/ $GEOAPI_DATA_BASE_URL/communes/insee_population_metropole.csv
wget -N -P data/ $GEOAPI_DATA_BASE_URL/communes/insee_population_dom.csv
echo "Completed"
