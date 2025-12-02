#!/bin/bash
# Start both API server and Vite dev server

# Start API server in background
npx tsx server/index.ts &
API_PID=$!

# Wait a bit for API to start
sleep 2

# Start Vite
npx vite

# Clean up API server when Vite exits
kill $API_PID 2>/dev/null
