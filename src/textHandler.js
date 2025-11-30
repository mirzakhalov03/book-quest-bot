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

      const telegram_id = ctx.from.id;

      // 🔍 Check if user already exists
      const { data: existingUser, error: existingError } = await supabase
        .from('registration')
        .select('id, order_number')
        .eq('telegram_id', telegram_id)
        .single();

      if (existingError && existingError.code !== 'PGRST116') {
        console.error('Existing user check error:', existingError);
        return await ctx.reply('Xatolik yuz berdi. Keyinroq urinib ko‘ring yoki iltimos, @mirzakhalov03 bilan bog‘laning.');
      }

      if (existingUser) {
        const paddedOrder = String(existingUser.order_number).padStart(3, '0');
        ctx.session.waitingForName = false;
        return await ctx.reply(
          `Siz allaqachon ro‘yxatdan o‘tgansiz ✅\n` +
            `Sizning tartib raqamingiz: #${paddedOrder}`
        );
      }

      // 🛑 NEW: Check if registration is open
      const { data: setting } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'registration_open')
        .single();

      const registrationOpen = setting?.value ?? true;

      if (!registrationOpen) {
        ctx.session.waitingForName = false;
        return await ctx.reply(
          '🛑 Ro‘yxatdan o‘tish hozir yopiq. Iltimos, keyinroq qayta urinib ko‘ring.'
        );
      }

      // ✅ Continue original registration process
      const { formatted, error } = formatAndValidateFullName(ctx.message.text);
      if (error) {
        return await ctx.reply(error, { parse_mode: 'Markdown' });
      }

      const full_name = formatted;
      const username = typeof ctx.from.username === 'string' && ctx.from.username.trim() !== ''
        ? ctx.from.username
        : '';

      const { data: latestUser, error: latestError } = await supabase
        .from('registration')
        .select('order_number')
        .order('order_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestError) {
        console.error('Order number fetch error:', latestError);
        return await ctx.reply('Ro‘yxatdan o‘tishda xatolik yuz berdi. Iltimos, @mirzakhalov03 bilan bog‘laning.');
      }

      const nextOrder = (latestUser?.order_number || 0) + 1;
      const paddedOrder = String(nextOrder).padStart(3, '0');

      const { error: insertError } = await supabase.from('registration').insert([
        { telegram_id, username, full_name, order_number: nextOrder },
      ]);

      if (insertError) {
        console.error('Insert error:', insertError);
        return await ctx.reply('Ro‘yxatdan o‘tishda xatolik yuz berdi. Iltimos, @mirzakhalov03 bilan bog‘laning.');
      }

      const mainKeyboard = Markup.keyboard([
        ['📖 Kitob Haqida'],
        ["🏆 Sovg'alar"],
        ['🎧 Kitob Audiosi'],
        ['ℹ️ Jamoa Haqida']
      ])
        .resize()
        .persistent();

      await ctx.reply(
        `${full_name}, kitobxonlar safiga qo‘shilganingizdan xursandmiz! 😊\n` +
          `Siz muvaffaqiyatli ro‘yxatdan o‘tdingiz ✅\n` +
          `Sizning tartib raqamingiz: #${paddedOrder}`,
        mainKeyboard
      );

      await ctx.replyWithHTML(
        [
          `<b>Iltimos, qoidalar bilan tanishing:</b>\n` +
          `\n` +
          `— Tanlov ohirigacha <b>botni o‘chirib yubormang</b>.\n` +
          `— Tanlov yakunida test havolasi shu bot orqali yuboriladi.\n`+
          `— Bot orqali tanlov haqida ko'proq ma'lumot olishingiz mumkin`
        ].join('\n')
      );

      if (config.GROUP_CHAT_ID) {
        bot.telegram
          .sendMessage(
            config.GROUP_CHAT_ID,
            [
              `🆕 *Yangi ishtirokchi ro‘yxatdan o‘tdi!*`,
              ``,
              `👤 Ism: *${full_name}*`,
              `🆔 Telegram: ${username ? '@' + username : '—'}`,
              `📋 Tartib raqami: *#${paddedOrder}*`,
            ].join('\n'),
            { parse_mode: 'Markdown' }
          )
          .catch((err) =>
            console.warn('Group notification error (ignored):', err.message)
          );
      }

      ctx.session.waitingForName = false;
    } catch (err) {
      console.error('❌ Text handler error:', err);
      await ctx.reply('Kutilmagan xatolik yuz berdi, iltimos keyinroq urinib ko‘ring, yoki iltimos, @mirzakhalov03 bilan bog‘laning.');
      ctx.session.waitingForName = false;
    }
  });
};
