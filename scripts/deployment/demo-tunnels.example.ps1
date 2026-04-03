# Example: expose the Docker Compose client on port 3000 (recommended — one tunnel).

# Nginx in the client image proxies /api, /auth, /socket.io, and /multiplayer to the server.

#

#   cloudflared tunnel --url http://127.0.0.1:3000

#   # or: ngrok http 3000

#

# Copy the HTTPS URL into:

#   - sync-demo-redirect.ps1 -FrontendTunnelUrl 'https://...'  (omit -ApiTunnelUrl for single-tunnel mode)

#   - or update-ngrok-urls.bat (same URL for both prompts → VITE_API_BASE_URL = USE_ORIGIN_API_PREFIX)

#

# Then: docker compose build client (if .env changed), docker compose up -d

#

# --- Legacy: two tunnels (SPA + API on 3002) ---

#   cloudflared tunnel --url http://127.0.0.1:3000

#   cloudflared tunnel --url http://127.0.0.1:3002

# Use sync-demo-redirect.ps1 with -ApiTunnelUrl and -FrontendTunnelUrl; set VITE_API_BASE_URL to the API URL.



Write-Host 'This file is documentation only. Run tunnel commands in a separate shell.'

