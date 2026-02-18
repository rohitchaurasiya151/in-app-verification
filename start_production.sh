#!/bin/bash

# Ensure we are in the project root
cd "$(dirname "$0")"

echo "Starting server in PRODUCTION mode..."
export ENVIRONMENT=Production
exec npm start
