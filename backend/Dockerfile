FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npx prisma generate

ENV NODE_ENV=production
EXPOSE 5001

CMD ["node", "src/index.js"]