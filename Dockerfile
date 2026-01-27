# Use a Node 24 base image. We can not use distroless because Prisma commands depend on having a shell, as well as other OS functions available. 
# We want this because we need to run npm commands on startup, inside the container. 
# In order to inspect the tag associated with this image hash (and verify the version of node), you can run this command
# docker inspect --format='{{.RepoDigests}}' node@sha256:9632533eda8061fc1e9960cfb3f8762781c07a00ee7317f5dc0e13c05e15166f
# FROM node@sha256:cd7bcd2e7a1e6f72052feb023c7f6b722205d3fcab7bbcbd2d1bfdab10b1e935

FROM node:24-alpine

RUN apk add \
    openssl \
    bash \
    # TODO: MAYBE REMOVE VIM
    vim 


# Set the working directory
WORKDIR /app

# Copy package files first to cache dependency installation
COPY package*.json ./

# Install all dependencies (including devDependencies for the build)
RUN npm ci

# Copy the application source code
COPY . .

# Set temporary placeholder database URL for building
ENV STATREG_DB_URL_CONNECTION_STRING=postgresql://placeholder@localhost:5432/statreg_db

# Generate the Prisma client libraries
RUN npm run generate

# Build the application
RUN npm run build

# Prune devDependencies to keep only production dependencies
RUN npm prune --production

COPY run.sh /app/run.sh
RUN chmod +x /app/run.sh
RUN chmod a+w /tmp

# Expose the ports your application will use
EXPOSE 9000
EXPOSE 8080

# Command to start the application
# CMD [ "sh", "-c", "npm run db:deploy && npm run start" ]
# CMD [ "sh", "-c", "npm run start" ]

CMD ["/app/run.sh"]
