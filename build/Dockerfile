FROM node:18-alpine
ARG VERSION
RUN npm install -g json2server@${VERSION} --allow-root --unsafe-perm=true
USER nobody:nobody
WORKDIR /app
ENTRYPOINT ["json2server"]
