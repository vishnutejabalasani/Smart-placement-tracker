# Use Node 18 Alpine as a fast and secure base image
FROM node:18-alpine

# Set working directory inside container
WORKDIR /usr/src/app

# Copy package configurations first to leverage Docker build cache
COPY package*.json ./

# Install clean production dependencies
RUN npm ci --only=production

# Copy remaining source code
COPY . .

# Expose port 5000 for Express & WebSockets
EXPOSE 5000

# Set environment production profile
ENV NODE_ENV=production

# Run standard start script
CMD ["node", "server.js"]
