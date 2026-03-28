FROM node:20-alpine

COPY ./sql-ai-backend-hosted .

RUN npm install

CMD [ "node" , "server.js" ]

# docker build . -t querycraft-backend

# docker run -p 4000:3000 querycraft-backend
