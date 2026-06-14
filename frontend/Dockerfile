# Stage 1: Compiling React static assets with Vite
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dependency configuration files
COPY package*.json ./

# Install development & build dependencies
RUN npm ci

# Copy remaining frontend assets
COPY . .

# Run Vite build script (creates public dist/ folder)
RUN npm run build

# Stage 2: Deploying static bundle to Nginx server
FROM nginx:1.25-alpine

# Copy compiled Vite bundle from builder stage into Nginx html directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose default HTTP Nginx port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
