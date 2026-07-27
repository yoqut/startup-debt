import { createClient } from "@supabase/supabase-js";

// Vite ilova VITE_ prefiksini talab qiladi, lekin Vercel-Supabase integratsiyasi
// loyihaga NEXT_PUBLIC_ prefiksli o'zgaruvchilarni avtomatik qo'shadi -- shuning
// uchun ikkalasini ham qabul qilamiz, alohida VITE_* qo'shish shart emas.
const url =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  import.meta.env.PUBLIC_SUPABASE_URL;
const anonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const configured = Boolean(url && anonKey);

if (!configured) {
  console.warn(
    "Supabase sozlanmagan: VITE_SUPABASE_URL/ANON_KEY yoki NEXT_PUBLIC_SUPABASE_URL/ANON_KEY topilmadi."
  );
}

// url/anonKey bo'lmasa createClient() xato tashlaydi va butun ilova qulab tushadi --
// shuning uchun faqat ikkalasi mavjud bo'lganda yaratamiz; App.jsx "configured" holatini
// tekshirib, aks holda o'z sozlash xabarini ko'rsatadi.
export const supabase = configured ? createClient(url, anonKey) : null;
