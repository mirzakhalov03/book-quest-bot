import { supabase } from './supabase/supabase.js';
import { config } from './config.js';
import { formatAndValidateFullName } from './utils/helpers.js';

export const registerTextHandler = (bot) => {
  bot.on('text', async (ctx) => {
    if (ctx.session?.waitingForBroadcast) return; 
    if (!ctx.session?.waitingForName) return;

    const { formatted, error } = formatAndValidateFullName(ctx.message.text);
  if (error) {
    return await ctx.reply(error, { parse_mode: 'Markdown' });
  }

  const full_name = formatted; // properly capitalized and valid
  ctx.session.waitingForName = false;

    const telegram_id = ctx.from.id;
    const username = ctx.from.username || 'no_username';

    const { count, error: countError } = await supabase
      .from('registration')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Count error:', countError);
      return await ctx.reply('Xatolik yuz berdi. Iltimos keyinroq urinib ko‘ring.');
    }

    const order_number = (count || 0) + 1;
    const paddedOrder = String(order_number).padStart(3, '0');

    const { error: insertError } = await supabase.from('registration').insert([
      { telegram_id, username, full_name, order_number },
    ]);

    if (insertError) {
      console.error('Insert error:', insertError);
      return await ctx.reply('Ro‘yxatdan o‘tishda xatolik yuz berdi.');
    }

    const messages = [
      ctx.reply(
        `${full_name}, kitobxonlar safimizga qo‘shilganingizdan xursandmiz! 😊\n` +
          `Siz muvaffaqiyatli ro‘yxatdan o‘tdingiz ✅\n` +
          `Sizning tartib raqamingiz: #${paddedOrder}`
      ),
      ctx.reply(
        `Iltimos, ushbu botdan foydalanish qoidalariga e’tibor bering:\n` +
          `— Musobaqa yakunlanmaguncha botni o‘chirib yubormang.\n` +
          `— Kitob o‘qish muddati tugagach, test havolasi shu bot orqali yuboriladi.`
      ),
    ];

    if (config.GROUP_CHAT_ID) {
      messages.push(
        bot.telegram.sendMessage(
          config.GROUP_CHAT_ID,
          `🆕 Yangi ishtirokchi ro‘yxatdan o‘tdi!\n\n👤 Ism: ${full_name}\n🆔 Telegram: @${username}\n📋 Tartib raqami: #${paddedOrder}`
        )
      );
    }

    await Promise.all(messages);
    ctx.session.waitingForName = false;
  });
};
