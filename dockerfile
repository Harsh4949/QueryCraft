FROM node:20-alpine as frontend-builder

COPY ./QueryCraft /app

WORKDIR /app

RUN npm install
RUN npm run build

FROM node:20-alpine 

COPY ./sql-ai-backend-hosted /app
WORKDIR /app

RUN npm install

COPY --from=frontend-builder /app/dist /app/public

CMD [ "node" , "server.js" ]

# docker build . -t querycraft-backend

# docker run -p 4000:3000 querycraft-backend
