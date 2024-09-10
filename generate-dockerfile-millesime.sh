DOCKER_MILLESIME=${DOCKER_MILLESIME:-2024}

COMMUNES_ASSOCIEES_DELEGUEES=${COMMUNES_ASSOCIEES_DELEGUEES:-YES}

if [ "$DOCKER_MILLESIME" == "2024" ];
then
  YEAR=2024
  GIT_REF="v2.4.0"
elif [ "$DOCKER_MILLESIME" == "2023" ];
then
  YEAR=2023
  GIT_REF="v2.3.0"
else
  YEAR=2024
fi

cp Dockerfile DockerfileTemp
if [ -z ${GIT_REF+x} ];
then
  echo "No GIT_REF in this case"
  GIT_REF=$(git log -n1 --format="%h")
else
  echo "GIT_REF set"
  git checkout $GIT_REF;
fi
docker build -f DockerfileTemp -t apigeo:${GIT_REF} .

