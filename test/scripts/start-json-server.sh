#!/bin/bash
# Reset db.json to its initial state before starting json-server
# This ensures tests always start with clean data

DB_FILE="/codecept/test/data/rest/db.json"
BACKUP_FILE="/codecept/test/data/rest/db.json.backup"

# Create backup if it doesn't exist
if [ ! -f "$BACKUP_FILE" ]; then
  echo "Creating backup of original db.json..."
  cp "$DB_FILE" "$BACKUP_FILE"
fi

# Always restore from backup before starting
echo "Restoring db.json from backup..."
cp "$BACKUP_FILE" "$DB_FILE"

# Start the server
echo "Starting json-server..."
exec npm run test-server
