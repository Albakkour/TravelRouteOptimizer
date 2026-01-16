# Use official Node.js runtime (Cloud Run compatible)
FROM node:20-slim

# Create app directory
WORKDIR /app

# Copy dependency files first (better caching)
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the backend code
COPY . .

# Build TypeScript
RUN npm run build

# Cloud Run uses PORT env var
ENV NODE_ENV=production

# Expose port (Cloud Run injects PORT=8080)
EXPOSE 8080

# Start the server
CMD ["node", "dist/index.js"]
