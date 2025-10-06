#!/bin/sh
set -e

DB_PATH="/app/data/transcendence.db"

echo "🔍 Database kontrol ediliyor..."

if [ ! -f "$DB_PATH" ]; then
  echo "📦 Database bulunamadı. Yeni oluşturuluyor..."
  
  sqlite3 $DB_PATH "VACUUM;"
  
  npm run db:schema:log || true
  
  npm run db:mig:gen src/migrations/InitSchema
  
  npm run db:mig:run
else
  echo "✅ Database mevcut: $DB_PATH"
  
  npm run db:mig:run
fi

echo "🚀 Backend başlatılıyor..."
exec "$@"
