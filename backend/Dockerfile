FROM node:22-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production image
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules

# Create directories for database and uploads
RUN mkdir -p /app/data
RUN mkdir -p /app/uploads

# Copy uploads if they exist
COPY uploads/ /app/uploads/

# Ensure proper permissions
RUN chmod -R 755 /app/data
RUN chmod -R 755 /app/uploads

# Expose API port
EXPOSE 3000

# Start the server
CMD ["node", "dist/main"]