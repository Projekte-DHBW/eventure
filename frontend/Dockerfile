# Build stage
FROM node:22-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the Angular app for production
RUN npm run build --configuration=production

# Show build output directory for debugging
RUN ls -la dist/

# Production stage
FROM nginx:alpine

# IMPORTANT: Remove the default nginx configuration file
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the build artifacts from the build stage
# Make sure this path matches your actual build output path
COPY --from=build /app/dist/eventure/browser /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]