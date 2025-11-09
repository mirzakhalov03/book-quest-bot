import { Markup } from 'telegraf';
import { supabase } from '../supabase/supabase.js';
import { config } from '../config.js';
import { trackStartClick } from '../reports/visitorTracking.js';

export const registerCommands = (bot) => {
  bot.start(async (ctx) => {
    await trackStartClick(ctx); 

    try {
      const telegram_id = ctx.from.id;

      const { data: existingUser } = await supabase
        .from('registration')
        .select('id, full_name, order_number')
        .eq('telegram_id', telegram_id)
        .single();

      // ✅ Persistent keyboard — appears for everyone when /start is pressed
      const mainKeyboard = Markup.keyboard([
        ['📖 Book Info', '🎧 Book Audios', 'ℹ️ About Us']
      ]).resize().persistent();

      if (existingUser) {
        const paddedOrder = String(existingUser.order_number).padStart(3, '0');

        await Promise.all([
          ctx.reply(
            `Assalomu alaykum, ${existingUser.full_name}! 😊\n` +
              `Siz allaqachon ro‘yxatdan o‘tgansiz ✅\n` +
              `Sizning tartib raqamingiz: #${paddedOrder}`,
            mainKeyboard
          ),
          ctx.reply(
            `Iltimos, loyihada ushbu botdan foydalanish qoidalari bilan tanishib chiqing:\n\n` +
              `— Musobaqa yakunlanmaguncha botni o‘chirib yubormang.\n` +
              `— Kitob o‘qish muddati tugagach, sizga test havolasi shu bot orqali yuboriladi.`
          ),
        ]);
        return;
      }

      await ctx.replyWithHTML(
        `Assalomu alaykum, kitobxon do‘stim! 😊\n` +
          `<b>📚 Book Quest loyihasiga xush kelibsiz!</b>\n\n` +
          `Bu loyiha orqali biz har oy yangi kitobni birgalikda o‘qib, yakunda qisqa test orqali bilimimizni sinaymiz.\n\n` +
          `Ro‘yxatdan o‘tishni xohlaysizmi?`,
        {
          ...Markup.inlineKeyboard([
            [Markup.button.callback('✅ Ha, ro‘yxatdan o‘taman', 'confirm_yes')],
            [Markup.button.callback('❌ Yo‘q, keyinroq', 'confirm_no')],
          ]),
          ...mainKeyboard, // persistent bottom menu (appears for all users)
        }
      );
    } catch (err) {
      console.error('⚠️ start error:', err);
      await ctx.reply('Xatolik yuz berdi, iltimos keyinroq urinib ko‘ring.');
    }
  });

  // ✅ Handle Book Info button
  bot.hears('📖 Book Info', async (ctx) => {
    await ctx.replyWithHTML(
      `📘 <b>Joriy kitob:</b> “Hadis va Hayot – I jild”\n\n` +
      `🖋 <b>Muallif:</b> Shayx Muhammad Sodiq Muhammad Yusuf\n` +
      `📖 <b>Tavsif:</b> Ushbu kitob hadislar orqali inson hayotini Qur’on va Sunnat asosida yoritadi.`
    );
  });
  bot.hears('🎧 Book Audios', async (ctx) => {
    await ctx.replyWithHTML('Soon, book audios are coming...\n\nStay with us! 😊')
  })
  bot.hears('ℹ️ About Us', async (ctx) => {
    await ctx.replyWithHTML('Soon, About Us is coming...\n\nStay with us! 😊')
  })
};
