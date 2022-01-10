#!/bin/bash
echo "Create data directory"
mkdir -p data
echo "Retrieve datasets"
wget -N -P data/ http://etalab-datasets.geo.data.gouv.fr/contours-administratifs/2021/geojson/communes-heavy-simplified.geojson.gz
wget -N -P data/ http://etalab-datasets.geo.data.gouv.fr/contours-administratifs/2021/geojson/communes-light-simplified.geojson.gz
#wget -N -P data/ https://osm13.openstreetmap.fr/~cquest/openfla/export/communes-20210101-shp.zip
#mapshaper-xl communes-20210101.shp -simplify 35% keep-shapes -o communes-35p.geojson
#mapshaper-xl communes-20210101.shp -simplify 5% keep-shapes -o communes-5p.geojson
#gzip communes-35p.geojson
#gzip communes-5p.geojson
#wget ftp://Admin_Express_ext:Dahnoh0eigheeFok@ftp3.ign.fr/ADMIN-EXPRESS-COG_3-0__SHP__FRA_WM_2021-05-19.7z
#unp ADMIN-EXPRESS-COG_3-0__SHP__FRA_WM_2021-05-19.7z
#ogr2ogr -f GeoJSON commune_admin_express.geojson ADMIN-EXPRESS-COG_3-0__SHP__FRA_2021-05-19/ADMIN-EXPRESS-COG/1_DONNEES_LIVRAISON_2021-05-19/ADECOG_3-0_SHP_WGS84G_FRA/COMMUNE.shp -dialect SQLite -sql "SELECT INSEE_COM as code, NOM as nom, INSEE_DEP AS departement, INSEE_REG as region, geometry FROM COMMUNE" -lco RFC7946=YES -nln communes
#mapshaper-xl commune_admin_express.geojson -simplify 40% keep-shapes -o communes-light-simplified.geojson
#mapshaper-xl commune_admin_express.geojson -simplify 5% keep-shapes -o communes-heavy-simplified.geojson
#gzip communes-light-simplified.geojson
#gzip communes-heavy-simplified.geojson
echo "Completed"
