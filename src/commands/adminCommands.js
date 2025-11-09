// adminCommands.js
import { config } from '../config.js';

export const registerAdminCommands = (bot) => {
  bot.command('broadcast', async (ctx) => {
    const userId = ctx.from.id;

    if (!config.ADMINS.includes(userId)) {
      return ctx.reply('❌ Siz admin emassiz.');
    }

    ctx.session ??= {};
    ctx.session.waitingForBroadcast = true;
    await ctx.reply('✏️ Iltimos, foydalanuvchilarga yubormoqchi bo‘lgan xabaringizni kiriting:');
  });

  // You can add more admin commands here in the future
};
