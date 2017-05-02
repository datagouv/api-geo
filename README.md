# API Communes

[![Build Status](https://travis-ci.org/etalab/api-communes.svg?branch=master)](https://travis-ci.org/etalab/api-communes)
[![Coverage Status](https://coveralls.io/repos/github/sgmap/api-communes/badge.svg?branch=master)](https://coveralls.io/github/sgmap/api-communes?branch=master)
[![Dependency Status](https://david-dm.org/sgmap/api-communes.svg)](https://david-dm.org/sgmap/api-communes)

## Informations et documentation

[Consulter la fiche sur api.gouv.fr](https://api.gouv.fr/api/geoapi.html)

## Pré-requis

* [Node.js](https://nodejs.org/en/) >= 6.x
* wget
* bash

## Installation

_Note : Le téléchargement initial des données (~200 Mo) peut prendre un certain temps._

```bash
npm install # (--production)
npm run prepare-data
```

## Démarrage de l'API

```bash
npm start
```

## Lancer les tests

```bash
npm test
```

## Docker

```bash
docker-compose up
```

## Données sources

* [Code Officiel Géographique de l'INSEE](http://www.insee.fr/fr/methodes/nomenclatures/cog/telechargement.asp)
* [Découpage administratif communal français issu d'OpenStreetMap](https://www.data.gouv.fr/fr/datasets/decoupage-administratif-communal-francais-issu-d-openstreetmap/) (licence ODbL)
* [Base officielle des codes postaux](https://www.data.gouv.fr/fr/datasets/base-officielle-des-codes-postaux/) (licence ODbL)

## TODO

* Supprimer la dépendance à `bash` et `wget`
* Plus de tests
