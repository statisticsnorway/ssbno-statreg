# Use the official pnpm image (Debian-based). We can not use distroless because Prisma commands
# depend on having a shell, as well as other OS functions available.
# We want this because we need to run pnpm commands on startup, inside the container.

# Pnpm version 11.22: https://github.com/pnpm/pnpm/pkgs/container/pnpm/versions?filters%5Bversion_type%5D=tagged
FROM ghcr.io/pnpm/pnpm@sha256:eba76954b37ec1ba6187f0adb39caee1e31733194857eedd01319da0af3fa00d

RUN pnpm runtime set node 24 -g

RUN apt-get update -y && apt-get install -y openssl

# Set the working directory
WORKDIR /app

ENV CI=true

# Copy the application source code
COPY . .

# Install all dependencies (including devDependencies for the build)
RUN pnpm install --frozen-lockfile --ignore-scripts

# Set temporary placeholder database URL for building
ENV PGURL=postgresql://placeholder@localhost:5432/statreg_db

# Generate the Prisma client libraries
RUN pnpm run generate

# Build the application
RUN pnpm run build

# Prune devDependencies to keep only production dependencies
RUN pnpm prune --prod

# Expose the ports your application will use
EXPOSE 9000
EXPOSE 8080

# Command to start the application
CMD [ "sh", "-c", "pnpm run db:deploy && pnpm run start" ]
