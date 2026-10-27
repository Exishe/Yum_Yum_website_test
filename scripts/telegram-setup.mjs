#!/usr/bin/env node
/*
 * Connects order notifications to Telegram, step by step, in Russian.
 * Asks for the bot token, finds the chat from the first message sent to the
 * bot, sends a test message and writes TELEGRAM_* to .env.local (which git
 * ignores, so the token never leaves this computer).
 * Run: node scripts/telegram-setup.mjs  (or double-click YumYum-Telegram.command)
 */
import { chmodSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";

const API = process.env.TELEGRAM_API ?? "https://api.telegram.org"; // overridable for tests
const ENV_FILE = ".env.local";
const WAIT_SECONDS = 180;

const rl = createInterface({ input: process.stdin, output: process.stdout });
const say = (s = "") => console.log(s);
const fail = (s) => {
  console.error(`\n✖ ${s}`);
  process.exit(1);
};

async function call(token, method, body) {
  const res = await fetch(`${API}/bot${token}/${method}`, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  const data = await res.json().catch(() => ({}));
  if (!data.ok) throw new Error(data.description ?? `HTTP ${res.status}`);
  return data.result;
}

/** Sets or replaces KEY=value lines, keeping everything else in the file. */
function writeEnv(values) {
  const lines = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, "utf8").split("\n") : [];
  const rest = lines.filter((l) => !Object.keys(values).some((k) => l.startsWith(`${k}=`)));
  while (rest.length && rest.at(-1) === "") rest.pop();
  const added = Object.entries(values).map(([k, v]) => `${k}=${v}`);
  writeFileSync(ENV_FILE, [...rest, ...added, ""].join("\n"));
  chmodSync(ENV_FILE, 0o600); // the token is a password: only this user may read it
}

say("\nПодключаем уведомления о заказах в Telegram.\n");
say("Шаг 1. В Telegram откройте @BotFather, отправьте /newbot и придумайте имя боту.");
say("       BotFather пришлёт ключ вида 123456789:AAH... — скопируйте его.\n");
const token = (await rl.question("Вставьте ключ сюда и нажмите Enter: ")).trim();
if (!/^\d+:[\w-]{20,}$/.test(token))
  fail("Это не похоже на ключ бота. Скопируйте его из BotFather целиком.");

let bot;
try {
  bot = await call(token, "getMe");
} catch (err) {
  fail(`Telegram не принял ключ (${err.message}). Проверьте, что скопировали его полностью.`);
}
say(`\n✔ Бот найден: @${bot.username}`);

// Skip anything sent to the bot before now, so we pick up the new message.
let offset = 0;
try {
  const old = await call(token, "getUpdates", { timeout: 0 });
  if (old.length) offset = old.at(-1).update_id + 1;
} catch (err) {
  fail(`Не получилось прочитать сообщения бота (${err.message}).`);
}

say(
  `\nШаг 2. Откройте бота @${bot.username} в Telegram, нажмите «Start» и напишите ему что угодно.`,
);
say("       Хотите получать заказы в общую группу? Добавьте бота в группу и напишите там.");
say(`       Жду сообщение до ${WAIT_SECONDS / 60} минут…`);

let chat;
const until = Date.now() + WAIT_SECONDS * 1000;
while (!chat && Date.now() < until) {
  const updates = await call(token, "getUpdates", { offset, timeout: 10 }).catch(() => []);
  for (const u of updates) {
    offset = u.update_id + 1;
    const m = u.message ?? u.channel_post ?? u.my_chat_member;
    if (m?.chat) chat = m.chat;
  }
}
if (!chat) fail("Сообщение не пришло. Запустите ещё раз и напишите боту, пока окно открыто.");
const where = chat.type === "private" ? "личный чат" : `группа «${chat.title}»`;
say(`\n✔ Нашёл чат: ${where}`);

try {
  await call(token, "sendMessage", {
    chat_id: chat.id,
    text: "✅ YUM-YUM: уведомления о заказах подключены. Сюда будут приходить новые заказы с сайта.",
  });
} catch (err) {
  fail(`Не получилось отправить проверочное сообщение (${err.message}).`);
}

writeEnv({
  TELEGRAM_BOT_TOKEN: token,
  TELEGRAM_CHAT_ID: String(chat.id),
  NOTIFY_CHANNELS: "telegram",
});
say(`\n✔ Готово. Проверочное сообщение уже в Telegram.`);
say(`  Настройки сохранены в ${ENV_FILE} на этом компьютере (в GitHub не попадают).`);
say(
  "  Перезапустите сайт (закройте окно YumYum-Start и откройте снова) — и заказы пойдут в Telegram.\n",
);
rl.close();
