#!/bin/sh

# Exit on error
set -e

echo "Running database migrations..."
npx prisma db push --skip-generate

if [ "$SEED_DATABASE" = "true" ]; then
  echo "Seeding database..."
  npx prisma db seed
fi

# Start the application
echo "Starting application..."
exec node server.js
