#!/bin/bash
# Двойной клик в Finder: обновляет проект, собирает быструю версию сайта
# и открывает её в браузере. Остановить: закрыть это окно или Control + C.

REPO="$HOME/Yum_Yum_website_test"
BRANCH="claude/vibrant-mccarthy-mby47q"
URL="http://localhost:3000/ru"
PNPM="npx -y pnpm@10.28.0"
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0 # без вопроса «скачать pnpm?»

say_step() { printf '\n\033[1;35m▶ %s\033[0m\n' "$1"; }
fail() {
  printf '\n\033[1;31m✖ %s\033[0m\n' "$1"
  echo "Сделайте скриншот этого окна и отправьте его Claude."
  read -r -p "Нажмите Enter, чтобы закрыть окно…"
  exit 1
}

cd "$REPO" 2>/dev/null || fail "Не нашёл папку проекта: $REPO"
command -v node >/dev/null || fail "Не установлен Node.js (https://nodejs.org)."

# Сайт уже запущен в другом окне — просто открываем браузер.
if curl -s -o /dev/null "$URL"; then
  say_step "Сайт уже запущен, открываю браузер"
  open "$URL"
  exit 0
fi

say_step "1/3 Скачиваю последние изменения с GitHub"
git fetch -q origin "$BRANCH" && git checkout -q "$BRANCH" 2>/dev/null
if ! git merge -q --ff-only "origin/$BRANCH" 2>/dev/null; then
  echo "Не получилось обновить автоматически (есть локальные изменения)."
  echo "Запускаю версию, которая уже есть на компьютере."
fi

say_step "2/3 Проверяю программы для сайта"
$PNPM install --frozen-lockfile --reporter=silent --config.confirm-modules-purge=false || fail "Не удалось установить зависимости."

say_step "3/3 Собираю быструю версию (1–2 минуты), потом браузер откроется сам"
# Ждём, пока сайт ответит, и открываем браузер.
(
  for _ in $(seq 1 300); do
    if curl -s -o /dev/null "$URL"; then
      open "$URL"
      printf '\n\033[1;32m✔ Сайт открыт: %s  (также /hy и /en)\033[0m\n' "$URL"
      printf '\033[1;32m  Админка: /admin  логин admin@yumyum.local  пароль yumyum-demo-2026\n  Не закрывайте это окно, пока смотрите сайт.\033[0m\n\n'
      exit 0
    fi
    sleep 2
  done
) &

$PNPM share || fail "Сайт не запустился."
