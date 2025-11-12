// adminCommands.js
import { config } from '../config.js';

export const registerAdminCommands = (bot) => {
  // 🛡️ Helper function to check admin access
  const isAdmin = (userId) => config.ADMINS?.includes(userId);

  bot.command('broadcast', async (ctx) => {
    try {
      const userId = ctx.from.id;

      // ❌ Deny non-admins immediately
      if (!isAdmin(userId)) {
        return await ctx.reply('❌ Siz admin emassiz.');
      }

      // 🧹 Initialize or reset session state safely
      ctx.session ??= {};
      if (ctx.session.waitingForBroadcast) {
        return await ctx.reply('⚠️ Siz allaqachon broadcast xabari kiritish jarayonidasiz.');
      }

      // 🕹️ Activate broadcast mode
      ctx.session.waitingForBroadcast = true;

      await ctx.reply(
        '✏️ Iltimos, foydalanuvchilarga yubormoqchi bo‘lgan xabaringizni kiriting:',
        { disable_notification: true }
      );
    } catch (err) {
      console.error('Broadcast command error:', err);
      await ctx.reply('Xatolik yuz berdi. Iltimos, keyinroq urinib ko‘ring.');
    }
  });

  // 🧩 Placeholder for future admin commands
  // Example:
  // bot.command('stop_registration', async (ctx) => { ... })
};
