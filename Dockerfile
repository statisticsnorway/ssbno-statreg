# Use a Node 24 slim base image. We can not use distroless because Prisma commands depend on having a shell, as well as other OS functions available. 
# We want this because we need to run npm commands on startup, inside the container. 
# In order to inspect the tag associated with this image hash (and verify the version of node), you can run this command
# docker inspect --format='{{.RepoDigests}}' node@sha256:9632533eda8061fc1e9960cfb3f8762781c07a00ee7317f5dc0e13c05e15166f
FROM node@sha256:03eae3ef7e88a9de535496fb488d67e02b9d96a063a8967bae657744ecd513f2

RUN apt-get update -y && apt-get install -y openssl

# Set the working directory
WORKDIR /app

# Copy the application source code
COPY . .

# Install all dependencies (including devDependencies for the build)
RUN npm i

# Set temporary placeholder database URL for building
ENV PGURL=postgresql://placeholder@localhost:5432/statreg_db

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
CMD [ "sh", "-c", "npm run db:deploy && npm run start" ]
