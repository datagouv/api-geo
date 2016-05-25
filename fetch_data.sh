#!/bin/bash
echo "Create data directory"
mkdir -p data
echo "Retrieve datasets"
wget -N -P data/ https://storage.gra1.cloud.ovh.net/v1/AUTH_a9f396d3ab3e49838ec561c23de6c669/geoapi-data/communes/laposte_hexasmal.json
wget -N -P data/ https://storage.gra1.cloud.ovh.net/v1/AUTH_a9f396d3ab3e49838ec561c23de6c669/geoapi-data/communes/communes-dp25.json
echo "Completed"
