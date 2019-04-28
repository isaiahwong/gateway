FROM node:8-alpine as build

RUN apk add --update --no-cache \
    python \
    make \
    g++ 

WORKDIR /app
COPY ./package.json .
RUN npm i
WORKDIR .
COPY . .
RUN npm run build

FROM node:8-alpine
WORKDIR /app
COPY ./package.json ./
RUN npm install --production
COPY ./.env ./
COPY ./locales ./locales
COPY ./proto ./proto
COPY --from=build /app/out ./out
CMD ["npm", "start"]