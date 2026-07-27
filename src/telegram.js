// Telegram foydalanuvchi ID -> do'st indeksi (settings.name0/name1 tartibida).
// Ism o'zgartirilsa ham bu moslik saqlanadi, chunki Telegram ID doimiy identifikator.
export const FRIEND_TELEGRAM_IDS = [1230394567, 593467614]; // [Muhammadali, Ulug'bek]

const BG_HEX = { light: "#eef0f5", dark: "#0b0d12" };

export function getTg() {
  return window.Telegram?.WebApp ?? null;
}

/** Ilova ochilganda bir marta chaqiriladi: ready/expand + qulay sozlamalar. */
export function initTelegram() {
  const tg = getTg();
  if (!tg) return null;
  tg.ready?.();
  tg.expand?.();
  try {
    tg.disableVerticalSwipes?.();
  } catch {
    /* eski klient qo'llamasligi mumkin */
  }
  return tg;
}

export function getTelegramUser() {
  return getTg()?.initDataUnsafe?.user ?? null;
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

function schemeOf(tg) {
  return tg?.colorScheme === "dark" ? "dark" : "light";
}

/** Ilovaning light/dark holatini Telegram mavzusiga moslaydi (OS emas, Telegram hal qiladi). */
export function applyTelegramTheme(tg) {
  if (!tg) return;
  document.documentElement.dataset.theme = schemeOf(tg);
}

/** Telegram native header/fon rangini ilovamiznikiga moslaydi -- chok ko'rinmasin. */
export function syncTelegramChrome(tg) {
  if (!tg) return;
  const hex = BG_HEX[schemeOf(tg)];
  try {
    tg.setHeaderColor?.(hex);
  } catch {
    /* eski klientlarda faqat 'bg_color'/'secondary_bg_color' qabul qilinadi */
    try {
      tg.setHeaderColor?.("bg_color");
    } catch {
      /* noop */
    }
  }
  try {
    tg.setBackgroundColor?.(hex);
  } catch {
    /* noop */
  }
}

/** tg.viewportStableHeight'ni CSS o'zgaruvchisiga yozadi -- klaviatura ochilganda to'g'ri balandlik. */
export function syncTelegramViewportVar(tg) {
  if (!tg) return;
  const h = tg.viewportStableHeight || tg.viewportHeight;
  if (h) document.documentElement.style.setProperty("--tg-vh", `${h}px`);
}

/**
 * kind: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' (impact)
 *       'success' | 'error' | 'warning' (notification)
 */
export function haptic(kind = "light") {
  const h = getTg()?.HapticFeedback;
  if (!h) return;
  if (kind === "success" || kind === "error" || kind === "warning") {
    h.notificationOccurred?.(kind);
  } else {
    h.impactOccurred?.(kind);
  }
}
