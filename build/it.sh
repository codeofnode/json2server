
set -e
VER=`sed 's/.*"version": "\(.*\)".*/\1/;t;d' ../package.json`
docker build .  --build-arg VERSION=${VER} -t codeofnode/json2server:$VER
docker tag codeofnode/json2server:$VER codeofnode/json2server:latest
docker push codeofnode/json2server:$VER
docker push codeofnode/json2server:latest
