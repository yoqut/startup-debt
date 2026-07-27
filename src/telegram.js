// Telegram foydalanuvchi ID -> do'st indeksi (settings.name0/name1 tartibida).
// Ism o'zgartirilsa ham bu moslik saqlanadi, chunki Telegram ID doimiy identifikator.
export const FRIEND_TELEGRAM_IDS = [1230394567, 593467614]; // [Muhammadali, Ulug'bek]

export function getTelegramUser() {
  const tg = window.Telegram?.WebApp;
  if (!tg) return null;
  tg.ready?.();
  tg.expand?.();
  return tg.initDataUnsafe?.user ?? null;
}

export function resolveFriendIndex(telegramUser) {
  if (!telegramUser) return null;
  const idx = FRIEND_TELEGRAM_IDS.indexOf(telegramUser.id);
  return idx === -1 ? null : idx;
}

export function telegramDisplayName(telegramUser) {
  if (!telegramUser) return null;
  return [telegramUser.first_name, telegramUser.last_name].filter(Boolean).join(" ");
}
