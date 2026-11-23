FROM node:20-alpine

ENV NODE_ENV=production \
    PORT=5002

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY backend/package.json backend/package-lock.json ./backend/
RUN npm ci --prefix backend --omit=dev

COPY backend ./backend
COPY frontend ./frontend

EXPOSE 5002

CMD ["npm", "start"]
