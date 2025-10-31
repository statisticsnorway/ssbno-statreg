# Use a Node.js 22 base image for the builder stage
FROM node:22.21.1-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy package files first to cache dependency installation
COPY package*.json ./

# Install all dependencies (including devDependencies for the build)
RUN npm install

# Copy the application source code
COPY . .

# Build the application using Vite
RUN npm run build

# Prune devDependencies to keep only production dependencies
RUN npm prune --production

# Rename the built main.js to main.mjs
RUN mv dist/main.js main.mjs

# Use a lightweight Node.js distroless base image for the final image
FROM gcr.io/distroless/nodejs22-debian13@sha256:a25df3d96ed6551ed694b63fa31e6b62dd05085ca59700889a4732df81878fd3

# Set the working directory
WORKDIR /app

# Copy only the built application (main.mjs) and production dependencies
COPY --from=builder /app/main.mjs /app/main.mjs
COPY --from=builder /app/node_modules /app/node_modules

# Expose the ports your application will use
EXPOSE 9000
EXPOSE 8080

# Command to start the application
CMD ["main.mjs"]
