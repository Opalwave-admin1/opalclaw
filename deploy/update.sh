#!/bin/bash
set -e

cd /home/opalclaw/opalclaw
git pull origin main
npm install
npm run build
pm2 restart opalclaw
echo "✅ OpalClaw updated and restarted at $(date)"
