FROM node:alpine as build
WORKDIR /app
COPY ./package.json .
RUN npm i
WORKDIR .
COPY . .
RUN npm run build

FROM node:alpine
WORKDIR /app
COPY ./package.json ./
RUN npm install --production
COPY ./.env ./
COPY ./locales ./locales
COPY --from=build /app/out ./out
CMD ["npm", "start"]