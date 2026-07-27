import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react()],
    // Vercel-Supabase integratsiyasi NEXT_PUBLIC_ prefiksli o'zgaruvchilarni
    // avtomatik qo'shadi -- ularni ham client bundle'ga kiritish uchun.
    envPrefix: ["VITE_", "NEXT_PUBLIC_"],
    define: {
      // Faqat shu bitta (maxfiy bo'lmagan) qiymatni ataylab client bundle'ga
      // qo'shamiz -- SUPABASE_URL prefiksisiz keladi, shuning uchun envPrefix
      // uni ilg'amaydi. Qo'shni maxfiy o'zgaruvchilar (SERVICE_ROLE_KEY,
      // JWT_SECRET, POSTGRES_*) bunga tegishli emas va client'ga chiqmaydi.
      "import.meta.env.PUBLIC_SUPABASE_URL": JSON.stringify(env.SUPABASE_URL || ""),
    },
  };
});
