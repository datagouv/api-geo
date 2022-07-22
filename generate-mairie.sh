wget -N -P data/ http://files.opendatarchives.fr/professionnels.ign.fr/adminexpress/ADMIN-EXPRESS-COG_3-1__SHP__FRA_WM_2022-04-15.7z
cd data
7z e ADMIN-EXPRESS-COG_3-1__SHP__FRA_WM_2022-04-15.7z CHFLIEU_COMMUNE.* COMMUNE.* CHFLIEU_ARRONDISSEMENT_MUNICIPAL.* ARRONDISSEMENT_MUNICIPAL.* -r -aoa

rm chflieu_*.geojson

# Mairies communes
ogr2ogr -overwrite \
        -f GeoJSON \
        -dialect SQLite \
        -sql "SELECT \"INSEE_COM\" AS insee_com, CASE WHEN chf.geometry IS NULL THEN 'centre' ELSE 'mairie' END AS type, CASE WHEN chf.geometry IS NULL THEN PointOnSurface(\"COMMUNE\".geometry) ELSE chf.geometry END AS geometry FROM \"COMMUNE\" LEFT JOIN 'CHFLIEU_COMMUNE.shp'.\"CHFLIEU_COMMUNE\" chf ON chf.\"ID_COM\" = \"COMMUNE\".\"ID\"" \
        chflieu_commune.geojson \
        COMMUNE.shp \
        -lco RFC7946=YES \
        -lco WRITE_NAME=NO

# Mairies Arrondissements
ogr2ogr -overwrite \
        -f GeoJSON \
        -dialect SQLite \
        -sql "SELECT \"INSEE_ARM\" AS insee_com, 'mairie' AS type, chf.geometry AS geometry FROM \"ARRONDISSEMENT_MUNICIPAL\" LEFT JOIN 'CHFLIEU_ARRONDISSEMENT_MUNICIPAL.shp'.\"CHFLIEU_ARRONDISSEMENT_MUNICIPAL\" chf ON chf.\"ID_COM\" = \"ARRONDISSEMENT_MUNICIPAL\".\"ID\"" \
        chflieu_arrondissement_municipal.geojson \
        ARRONDISSEMENT_MUNICIPAL.shp \
        -lco RFC7946=YES \
        -lco WRITE_NAME=NO

ogrmerge.py -overwrite_ds\
	    -o chflieu_commune_arrondissement_municipal.geojson \
            -single \
            chflieu_commune.geojson \
            chflieu_arrondissement_municipal.geojson \
            -lco RFC7946=YES \
            -lco WRITE_NAME=NO

gzip -c -d data/communes-5m.geojson.gz | jq -c -r '.features[] | select(.properties.departement | IN("975","977","978","984","986","987","988","989"))' \
     | ndjson-map -r turf=@turf/turf \
     'code = d.properties.code, d = turf.bbox(d, {properties: d.properties}), d = {"bbox": d, "code": code}, d'

# for row in $(echo "${sample}" | jq -r '.[] | @base64'); do
#     _jq() {
#      echo ${row} | base64 --decode | jq -r ${1}
#     }
#    wget -O $(_jq '.[0]') $(_jq '.[1]');
# done;

echo '[out:json][timeout:25];(node["amenity"="townhall"](-28.960088688007,-160.048828125,-6.6646075621726,-129.1552734375);way["amenity"="townhall"](-28.960088688007,-160.048828125,-6.6646075621726,-129.1552734375);relation["amenity"="townhall"](-28.960088688007,-160.048828125,-6.6646075621726,-129.1552734375););out;>;out skel qt;' | query-overpass
# gzip -c -d data/communes-5m.geojson.gz | jq -c -r '.features[] | select(.properties.departement | IN("975","977","978","984","986","987","988","989"))' | wc -l

# gzip -c -d data/communes-5m.geojson.gz | jq -c -r '.features[]' \
#     | ndjson-map -r turf=@turf/turf 'd = turf.bbox(d, {properties: d.properties}), d' \
#     | ndjson-reduce 'p.features.push(d), p' '{type: "FeatureCollection", features: []}'

cd ..
