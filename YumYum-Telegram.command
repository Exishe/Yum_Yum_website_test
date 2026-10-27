#!/bin/bash
# Двойной клик в Finder: подключает уведомления о заказах в Telegram.
# Ключ бота сохраняется только на этом компьютере (.env.local), в GitHub не попадает.

REPO="$HOME/Yum_Yum_website_test"

cd "$REPO" 2>/dev/null || {
  echo "Не нашёл папку проекта: $REPO"
  read -r -p "Нажмите Enter, чтобы закрыть окно…"
  exit 1
}
git pull -q --ff-only 2>/dev/null

node scripts/telegram-setup.mjs
read -r -p "Нажмите Enter, чтобы закрыть окно…"
