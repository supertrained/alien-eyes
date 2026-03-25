FROM mcr.microsoft.com/playwright:v1.58.2-jammy

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci || npm install

COPY . .

ENV NODE_ENV=production
EXPOSE 8080

CMD ["npm", "run", "worker:start"]
