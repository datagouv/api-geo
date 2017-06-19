#!/bin/bash
GEOAPI_DATA_BASE_URL=https://storage.gra1.cloud.ovh.net/v1/AUTH_a9f396d3ab3e49838ec561c23de6c669/geoapi-data
echo "Create data directory"
mkdir -p data
echo "Retrieve datasets"
wget -N -P data/ $GEOAPI_DATA_BASE_URL/communes/laposte_hexasmal_2017.json
wget -N -P data/ $GEOAPI_DATA_BASE_URL/communes/communes-dp25.json
wget -N -P data/ $GEOAPI_DATA_BASE_URL/communes/insee_cog_france2017.tsv
wget -N -P data/ $GEOAPI_DATA_BASE_URL/communes/insee_cog_arrond2017.tsv
wget -N -P data/ $GEOAPI_DATA_BASE_URL/communes/insee_cog_depts2017.tsv
wget -N -P data/ $GEOAPI_DATA_BASE_URL/communes/insee_cog_reg2017.tsv
wget -N -P data/ $GEOAPI_DATA_BASE_URL/communes/insee_population_metropole.csv
wget -N -P data/ $GEOAPI_DATA_BASE_URL/communes/insee_population_dom.csv
echo "Completed"
