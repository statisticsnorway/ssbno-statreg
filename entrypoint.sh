#!/bin/sh

# Exit scriptet med en gang om en command feiler
# Starter ikke appen om migrations er bugged
set -e

npx prisma migrate deploy
exec node dist/main.js