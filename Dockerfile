# Use Node.js 22 as base image
FROM node:22-slim

# Install pnpm
RUN npm install -g pnpm@10.6.0

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install ALL dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the backend
RUN pnpm build:backend

# Remove devDependencies to reduce image size
RUN pnpm prune --prod

# Expose port
EXPOSE 8080

# Start the server
CMD ["node", "dist/server/_core/index.js"]
