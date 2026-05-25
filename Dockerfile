FROM node:20-alpine AS builder
# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app

# Copy package and install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled source from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Start server
CMD ["npm", "start"]
