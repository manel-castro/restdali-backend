FROM node:lts As development

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .


RUN npx prisma generate

CMD ["npm", "start"]