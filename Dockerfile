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

# Build the application
RUN npm run build

# Prune devDependencies to keep only production dependencies
RUN npm prune --production

ENV NODE_ENV=development

# Expose the ports your application will use
EXPOSE 9000
EXPOSE 8080

# Command to start the application
CMD [ "sh", "-c", "npm run db:deploy && npm run start" ]