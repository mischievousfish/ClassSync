FROM node:20-bookworm-slim
WORKDIR /workspace
COPY package*.json ./
RUN npm ci
COPY apps/backend ./apps/backend
COPY firebase.json ./firebase.json
EXPOSE 3000
CMD ["npm", "run", "dev"]
