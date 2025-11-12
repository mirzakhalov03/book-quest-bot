import { supabase } from './supabase/supabase.js';
import { config } from './config.js';
import { formatAndValidateFullName } from './utils/helpers.js';
import { Markup } from 'telegraf';

export const registerTextHandler = (bot) => {
  bot.on('text', async (ctx) => {
    try {
      // 🛑 Skip if not expecting a name or currently broadcasting
      if (ctx.session?.waitingForBroadcast) return;
      if (!ctx.session?.waitingForName) return;

      const { formatted, error } = formatAndValidateFullName(ctx.message.text);
      if (error) {
        return await ctx.reply(error, { parse_mode: 'Markdown' });
      }

      const full_name = formatted;
      const telegram_id = ctx.from.id;
      const username = ctx.from.username || 'no_username';

      // 🔐 Prevent duplicate registration
      const { data: existingUser, error: existingError } = await supabase
        .from('registration')
        .select('id, order_number')
        .eq('telegram_id', telegram_id)
        .single();

      if (existingError && existingError.code !== 'PGRST116') {
        console.error('Existing user check error:', existingError);
        return await ctx.reply('Xatolik yuz berdi. Keyinroq urinib ko‘ring.');
      }

      if (existingUser) {
        const paddedOrder = String(existingUser.order_number).padStart(3, '0');
        ctx.session.waitingForName = false;
        return await ctx.reply(
          `Siz allaqachon ro‘yxatdan o‘tgansiz ✅\n` +
            `Sizning tartib raqamingiz: #${paddedOrder}`
        );
      }

      // 🧮 Use a transaction-like pattern to get safe incremental order
      const { data: latestUser, error: latestError } = await supabase
        .from('registration')
        .select('order_number')
        .order('order_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestError) {
        console.error('Order number fetch error:', latestError);
        return await ctx.reply('Ro‘yxatdan o‘tishda xatolik yuz berdi.');
      }

      const nextOrder = (latestUser?.order_number || 0) + 1;
      const paddedOrder = String(nextOrder).padStart(3, '0');

      // 📝 Insert new record
      const { error: insertError } = await supabase.from('registration').insert([
        { telegram_id, username, full_name, order_number: nextOrder },
      ]);

      if (insertError) {
        console.error('Insert error:', insertError);
        return await ctx.reply('Ro‘yxatdan o‘tishda xatolik yuz berdi.');
      }

      // ✅ Main menu keyboard
      const mainKeyboard = Markup.keyboard([
        ['📖 Kitob Haqida'],
        ['🎧 Kitob Audiosi'],
        ['ℹ️ Jamoa Haqida']
      ])
        .resize()
        .persistent();

      // 💬 Sequential user messages
      await ctx.reply(
        `${full_name}, kitobxonlar safimizga qo‘shilganingizdan xursandmiz! 😊\n` +
          `Siz muvaffaqiyatli ro‘yxatdan o‘tdingiz ✅\n` +
          `Sizning tartib raqamingiz: #${paddedOrder}`,
        mainKeyboard
      );

      await ctx.reply(
        `Iltimos, ushbu botdan foydalanish qoidalariga e’tibor bering:\n` +
          `— Musobaqa yakunlanmaguncha botni o‘chirib yubormang.\n` +
          `— Kitob o‘qish muddati tugagach, test havolasi shu bot orqali yuboriladi.`
      );

      // 📢 Notify admin group (non-blocking)
      if (config.GROUP_CHAT_ID) {
        bot.telegram
          .sendMessage(
            config.GROUP_CHAT_ID,
            [
              `🆕 *Yangi ishtirokchi ro‘yxatdan o‘tdi!*`,
              ``,
              `👤 Ism: *${full_name}*`,
              `🆔 Telegram: @${username}`,
              `📋 Tartib raqami: *#${paddedOrder}*`,
            ].join('\n'),
            { parse_mode: 'Markdown' }
          )
          .catch((err) =>
            console.warn('Group notification error (ignored):', err.message)
          );
      }

      // ✅ Cleanup session
      ctx.session.waitingForName = false;
    } catch (err) {
      console.error('❌ Text handler error:', err);
      await ctx.reply('Kutilmagan xatolik yuz berdi, iltimos keyinroq urinib ko‘ring.');
      ctx.session.waitingForName = false; // always reset on fail
    }
  });
};
