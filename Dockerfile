# Use a Node.js 22 base image. We can not use distroless because Vite commands depend on having a shell, as well as other OS functions available. 
# We want this because we need to run npm commands on startup, inside the container. 
FROM node:22.13.0-alpine3.23@sha256:9632533eda8061fc1e9960cfb3f8762781c07a00ee7317f5dc0e13c05e15166f

# Set the working directory
WORKDIR /app

# Copy package files first to cache dependency installation
COPY package*.json ./

# Install all dependencies (including devDependencies for the build)
RUN npm ci

# Copy the application source code
COPY . .

# Set temporary placeholder database URL for building
ENV NAIS_DATABASE_SSBNO_STATREG_API_STATREG_DB_URL=postgresql://placeholder@localhost:5432/statreg_db

# Generate the Prisma client libraries
RUN npm run generate

# Build the application
RUN npm run build

# Prune devDependencies to keep only production dependencies
RUN npm prune --production

# Expose the ports your application will use
EXPOSE 9000
EXPOSE 8080

# Command to start the application
# CMD [ "sh", "-c", "npm run db:deploy && npm run start" ]
CMD [ "sh", "-c", "npm run start" ]
