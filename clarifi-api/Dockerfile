# Dockerfile for NestJS backend

# --- Base Stage ---
FROM node:20-alpine AS base
WORKDIR /usr/src/app

# Install pnpm globally if you prefer to use it, or adjust for npm/yarn
# RUN npm install -g pnpm

# --- Dependencies Stage ---
FROM base AS dependencies
# Copy package.json and lock file
COPY package*.json ./

# Install dependencies (using npm as per project setup)
RUN npm install --only=production

# If you have a lot of devDependencies and want to prune them for production:
# RUN npm prune --production

# --- Build Stage ---
FROM base AS build
WORKDIR /usr/src/app
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm install

# Copy application source code
COPY . .

# Build the application
RUN npm run build

# --- Release Stage (Production) ---
FROM node:20-alpine AS release
WORKDIR /usr/src/app

# Copy package.json and lock file for runtime dependencies
COPY package*.json ./

# Install only production dependencies (cleaner production image)
RUN npm install --only=production

# Copy built application from build stage
COPY --from=build /usr/src/app/dist ./dist

# Expose the port the app runs on (default is 3000 for NestJS)
EXPOSE 3000

# Command to run the application
CMD ["node", "dist/main.js"] 