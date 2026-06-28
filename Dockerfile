FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY tsconfig.json ./
COPY . .

RUN npm run build

CMD ["node", "dist/server.js"]
