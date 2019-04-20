FROM node:alpine as base

FROM base as builder
WORKDIR /app
COPY ./package.json .
RUN npm i
WORKDIR .
COPY . .
RUN npm run build

FROM base
WORKDIR /app
COPY ./package.json ./
RUN npm install --production
COPY ./.env ./
COPY ./locales ./locales
COPY ./proto ./proto
COPY --from=build /app/out ./out
CMD ["npm", "start"]