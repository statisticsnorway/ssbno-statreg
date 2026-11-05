# Use the official pnpm image (Debian-based). We can not use distroless because Prisma commands
# depend on having a shell, as well as other OS functions available.
# We want this because we need to run pnpm commands on startup, inside the container.
# Pnpm version 11.22: https://github.com/pnpm/pnpm/pkgs/container/pnpm/versions?filters%5Bversion_type%5D=tagged
FROM ghcr.io/pnpm/pnpm@sha256:41c39d1c734b0a810669c07587888aa7dbe9ef9b4c8e98b346b3654f7b269b6d

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

RUN chmod +x backend/entrypoint.sh

ENTRYPOINT [ "backend/entrypoint.sh" ]
CMD [ "sh", "-c", "pnpm run db:deploy && pnpm run start" ]