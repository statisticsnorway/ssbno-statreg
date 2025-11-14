# Use a Node.js 22 base image. We can not use distroless because 
FROM node:22.21.1-alpine

# Set the working directory
WORKDIR /app

# Copy package files first to cache dependency installation
COPY package*.json ./

# Install all dependencies (including devDependencies for the build)
RUN npm install

# Copy the application source code
COPY . .

# Generate Prisma client
RUN npm run generate

# Build the application
RUN npm run build

# Prune devDependencies to keep only production dependencies
RUN npm prune --production

# Rename the built main.js to main.mjs
RUN mv dist/main.js main.mjs

ENV NODE_ENV=development

# Expose the ports your application will use
EXPOSE 9000
EXPOSE 8080

RUN chmod +x entrypoint.sh

# Command to start the application
ENTRYPOINT [ "./entrypoint.sh" ]