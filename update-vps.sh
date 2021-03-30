#!/bin/bash

# This script is used for updating the hosted version of this bot

echo "Killing process..."
kill -9 `pgrep node`

echo "Getting latest changes..."
git checkout main
git pull
npm install

echo "Starting server..."
nohup `node src/index.js` & disown