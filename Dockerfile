# Build stage: compiles the React app and bundles the Express server
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Run stage: lightweight layer with only production dependencies
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist

# Standard Cloud Run environmental variable setup
EXPOSE 8080
ENV NODE_ENV=production
ENV PORT=8080

CMD ["npm", "start"]
