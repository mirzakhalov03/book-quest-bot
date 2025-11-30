import dotenv from 'dotenv';

// Load correct env file depending on environment
dotenv.config({
  path: process.env.NODE_ENV === 'development' ? '.env.dev' : '.env',
});

export const config = {
  TELEGRAM_BOT_TOKEN:
    process.env.NODE_ENV === 'development'
      ? process.env.DEV_TELEGRAM_BOT_TOKEN
      : process.env.TELEGRAM_BOT_TOKEN,

  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  GROUP_CHAT_ID: process.env.GROUP_CHAT_ID,

  ADMINS: [
    Number(process.env.ADMIN_1),
    Number(process.env.ADMIN_2),
  ],
};

