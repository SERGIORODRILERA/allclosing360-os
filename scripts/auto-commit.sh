#!/bin/bash
# Auto-commit y sync con GitHub para proteger trabajo en VPS
# Corre cada 5 minutos via cron

set -euo pipefail

REPO="/opt/allclosing360"
LOG="/opt/allclosing360/logs/auto-commit.log"
MAX_LOG_LINES=500

cd "$REPO"

timestamp() { date '+%Y-%m-%d %H:%M:%S'; }

log() { echo "[$(timestamp)] $*" >> "$LOG"; }

# Rotar log si crece demasiado
if [ -f "$LOG" ] && [ "$(wc -l < "$LOG")" -gt "$MAX_LOG_LINES" ]; then
  tail -200 "$LOG" > "${LOG}.tmp" && mv "${LOG}.tmp" "$LOG"
fi

# Verificar que hay conexión a GitHub antes de intentar push
if ! git ls-remote origin HEAD &>/dev/null 2>&1; then
  log "WARN: Sin conexión a GitHub, skip push"
  # Aún hacer commit local si hay cambios
  SKIP_PUSH=true
else
  SKIP_PUSH=false
fi

# Verificar si hay cambios (tracked o untracked relevantes)
if git status --porcelain | grep -qE '^[ MADRCU?]'; then
  # Agregar todos los archivos excepto los ignorados
  git add -A

  # Generar mensaje de commit con timestamp y lista breve de cambios
  CHANGED_COUNT=$(git diff --cached --name-only | wc -l | tr -d ' ')
  CHANGED_FILES=$(git diff --cached --name-only | head -3 | tr '\n' ', ' | sed 's/,$//')
  if [ "$CHANGED_COUNT" -gt 3 ]; then
    MSG="auto: ${CHANGED_COUNT} archivos — ${CHANGED_FILES}..."
  else
    MSG="auto: ${CHANGED_FILES:-cambios sin nombre}"
  fi

  git commit -m "$MSG" --no-gpg-sign 2>&1 | tail -1 >> "$LOG"
  log "OK: Commit creado — $MSG"
else
  log "INFO: Sin cambios"
  # Sin cambios locales, solo intentar push si hay commits pendientes
fi

# Push a GitHub
if [ "$SKIP_PUSH" = false ]; then
  if git push origin HEAD 2>&1 | tail -1 >> "$LOG"; then
    log "OK: Push exitoso a GitHub"
  else
    log "WARN: Push falló — se reintentará en el próximo ciclo"
  fi
fi
