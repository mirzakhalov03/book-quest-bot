import dotenv from 'dotenv';
dotenv.config();

export const config = {
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  GROUP_CHAT_ID: process.env.GROUP_CHAT_ID,
  ADMINS: [
    Number(process.env.ADMIN_1),
    Number(process.env.ADMIN_2)
  ],
};
