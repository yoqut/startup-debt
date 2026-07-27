# Qarz Hisobchi

Ikki do'st o'rtasidagi xarid (50/50 bo'linadigan xarajat) va to'g'ridan qarz
berish/to'lashni hisoblab boradigan React + Supabase dastur.

## Qanday ishlaydi

- **Xarid**: har biringiz shu xaridga qancha pul qo'shganini kiritasiz
  (masalan Muhammadali 200 000, Ulug'bek 100 000). Ulush avtomatik teng
  bo'linadi va ortiqcha to'lagan tomonga qarz sifatida yoziladi.
- **Pul o'tkazma (qarz berish/to'lash)**: to'liq summa hisobga qo'shiladi —
  yangi qarz berish ham, avvalgi qarzni uzish ham shu orqali kiritiladi
  (yo'nalish avtomatik hisobni to'g'ri tarafga siljitadi).
- Umumiy hisob (kim kimga qancha qarzdor) tepada doim ko'rinib turadi.
- Ma'lumotlar Supabase'da saqlanadi, shu sabab ikkala do'st turli qurilmadan
  kirsa ham bir xil hisobni ko'radi va real vaqtda sinxronlanadi.

## 1. Supabase loyihasini sozlash

1. https://supabase.com da yangi loyiha oching (bepul reja yetarli).
2. Loyiha ochilgach: **SQL Editor** → **New query** → [`supabase/schema.sql`](supabase/schema.sql)
   faylidagi kodni joylashtirib **Run** bosing. Bu `settings` va `transactions`
   jadvallarini, RLS policy'larni va realtime yoqishni bajaradi.
3. **Project Settings → API** bo'limidan quyidagilarni oling:
   - `Project URL`
   - `anon public` key

> **Eslatma:** hozirgi sozlamada RLS "ochiq" (parolsiz) — linkni va anon
> key'ni bilgan har kim yoza/o'chira oladi. Bu 2 kishilik shaxsiy vosita uchun
> yetarli, lekin linkni begonalarga tarqatmang.

## 2. Lokal ishga tushirish

```bash
npm install
cp .env.example .env
# .env faylini oching va VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY qiymatlarini kiriting
npm run dev
```

Brauzerda `http://localhost:5173` ochiladi.

## 3. Vercel'ga joylash

1. Loyihani GitHub'ga push qiling (yoki `vercel` CLI orqali to'g'ridan-to'g'ri
   joylashtirsangiz ham bo'ladi).
2. https://vercel.com → **New Project** → repo'ni tanlang (Framework: **Vite**
   avtomatik aniqlanadi).
3. **Environment Variables** bo'limiga qo'shing:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. **Deploy** bosing.

CLI orqali:

```bash
npm i -g vercel
vercel
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel --prod
```

## Ismlarni o'zgartirish

Hisob kartochkasidagi tishli g'ildirak (sozlash) tugmasi orqali ikkala ism
o'zgartiriladi va Supabase'ga saqlanadi — barcha eski yozuvlar yangi ismlar
bilan ko'rinaveradi (chunki ismlar alohida saqlanadi, tranzaksiyalarda faqat
0/1 indeks bor).

## Telegram Mini App sifatida ishlatish

Ilova `window.Telegram.WebApp` orqali qaysi do'st ochganini avtomatik
aniqlaydi ([src/telegram.js](src/telegram.js)):

```js
export const FRIEND_TELEGRAM_IDS = [1230394567, 593467614]; // [Muhammadali, Ulug'bek]
```

- Telegram ichida ochilganda, tepada **"Siz: <Ism>"** chip ko'rinadi va
  "Qarz berish/to'lash" formasida yo'nalish avtomatik shu foydalanuvchidan
  boshlanadi.
- Har bir yozuv qaysi do'st tomonidan kiritilgani (`created_by_name`) tarixda
  kichik yozuv sifatida ko'rsatiladi.
- **Muhim:** bu identifikatsiya `initDataUnsafe` orqali client tomonda ishonch
  bilan olinadi, kriptografik tekshiruvsiz (server yo'q). 2 kishilik shaxsiy
  vosita uchun yetarli, lekin begona odam havolani ochsa (Telegram tashqarisida
  yoki ID mos kelmasa) shunchaki "Siz: ..." chipi ko'rinmaydi va oddiy rejimda
  ishlayveradi.

Botga ulash uchun (Vercel'ga joylagandan keyin):

1. [@BotFather](https://t.me/BotFather) da botingizni tanlang →
   **Bot Settings → Menu Button → Configure Menu Button** → Vercel domenini
   (masalan `https://qarz-hisobchi.vercel.app`) kiriting.
2. Yoki botga `/newapp` orqali to'liq Mini App sifatida ro'yxatdan o'tkazing.

`TELEGRAM_BOT_TOKEN` faqat BotFather/Bot API bilan ishlash uchun kerak —
ilovaning o'zi (frontend) bu tokendan foydalanmaydi va u hech qachon
`VITE_`-prefiksli o'zgaruvchiga qo'yilmasligi kerak (aks holda brauzerga
oshkor bo'lib qoladi).
