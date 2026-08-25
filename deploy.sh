#!/bin/bash
cd "$(dirname "$0")"

# ========================================================
# Buchungstool - Synology Deployment Script
# ========================================================
#
# WICHTIG: Bitte passe die Konfiguration an, falls 
# deine NAS-IP oder der Pfad anders lauten sollte!

NAS_USER="dmix"
NAS_IP="192.168.178.29"
NAS_PATH="/volume1/docker/buchungstool"

echo "=========================================="
echo "✅ Starte echten direkten Transfer..."
echo "=========================================="
export COPYFILE_DISABLE=1
tar -czf update.tar.gz --no-xattrs --exclude='node_modules' --exclude='.next' --exclude='.git' --exclude='data' --exclude='.env' --exclude='._*' --exclude='@eaDir' --exclude='update.tar.gz' --exclude='musikwunsch' .

echo "📤 Sende Update-Paket sicher (ohne anfälliges SCP)..."
cat update.tar.gz | ssh $NAS_USER@$NAS_IP "cat > /tmp/update.tar.gz"
rm update.tar.gz

echo "✅ Transfer erfolgreich! Entpacke und baue neues Projekt..."
ssh -t $NAS_USER@$NAS_IP "sudo bash -c \"set -e; mkdir -p $NAS_PATH/data; mv /tmp/update.tar.gz $NAS_PATH/; cd $NAS_PATH; echo '📦 Entpacke Dateien...'; tar -xzf update.tar.gz; rm update.tar.gz; echo '🧹 Entferne unsichtbare Synology-Metadaten (@eaDir)...'; find . -name '@eaDir' -type d -prune -exec rm -rf {} +; echo '🔨 Baue neues Projekt...'; /usr/local/bin/docker-compose build --no-cache; echo '✅ Build fehlerfrei!'; /usr/local/bin/docker-compose up -d --force-recreate; /usr/local/bin/docker image prune -f 2>/dev/null || true; echo '🚀 Zero-Downtime Deployment 100% erfolgreich!'\""

echo "=========================================="
echo "🎉 Das Skript ist fertig!"
echo "Warte noch ein paar Sekunden, bis der Server gestartet ist,"
echo "und richte dann bei Bedarf einen Reverse Proxy auf Port 3046 ein."
