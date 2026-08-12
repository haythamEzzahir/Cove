# Stage 1: Build the React client (single-origin deployment)
# Pass VITE_API_URL as an empty string (--build-arg VITE_API_URL=) so the
# frontend talks to the same origin that serves it.
FROM node:22-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Stage 2: Run the Express backend and serve the built client
FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY backend/package*.json ./backend/
RUN npm ci --omit=dev --prefix backend
COPY backend/ ./backend/
COPY --from=client-build /app/client/dist ./client/dist
ENV CLIENT_DIST=/app/client/dist
EXPOSE 5000
CMD ["node", "backend/server.js"]
