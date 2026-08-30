FROM node:20-alpine
WORKDIR /app
COPY package.json ./
# Corepack/npm avoids workspace issues when docker context is scoped to the sub-folder
RUN corepack disable || true && npm install --legacy-peer-deps
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start"]
