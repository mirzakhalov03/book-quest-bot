// adminCommands.js
import { config } from '../config.js';
import { supabase } from '../supabase/supabase.js';
import { Markup } from 'telegraf';

export const registerAdminCommands = (bot) => {
  const isAdmin = (userId) => config.ADMINS?.includes(userId);

  // ======= /broadcast (simple message to all users) =======
  bot.command('broadcast', async (ctx) => {
    const userId = ctx.from.id;
    if (!isAdmin(userId)) return ctx.reply('❌ Siz admin emassiz.');

    ctx.session ??= {};
    ctx.session.waitingForBroadcastMessage = true;

    await ctx.reply('✏️ Iltimos, barcha foydalanuvchilarga yubormoqchi bo‘lgan xabarni kiriting:');
  });

  // ======= /broadcastbyid =======
  bot.command('broadcastbyid', async (ctx) => {
    const userId = ctx.from.id;
    if (!isAdmin(userId)) return ctx.reply('❌ Siz admin emassiz.');

    ctx.session ??= {};
    if (ctx.session.waitingForRange)
      return ctx.reply('⚠️ Siz allaqachon broadcast range kiriting jarayonidasiz.');

    ctx.session.waitingForRange = true;
    await ctx.reply(
      '✏️ Iltimos, foydalanuvchilarni tanlash uchun raqam yoki range kiriting (masalan: 1 yoki 1-100):'
    );
  });

  bot.on('text', async (ctx, next) => {
    ctx.session ??= {};

    // ======= BROADCAST MESSAGE (for /broadcast) =======
    if (ctx.session.waitingForBroadcastMessage) {
      const message = ctx.message.text.trim();
      ctx.session.waitingForBroadcastMessage = false;

      if (!message) return ctx.reply('❌ Xabar bo‘sh bo‘lishi mumkin emas.');

      await ctx.reply('📤 Xabar yuborilmoqda, iltimos kuting...');

      try {
        const { data: users, error } = await supabase
          .from('registration')
          .select('telegram_id');

        if (error) throw error;

        for (const user of users) {
          try {
            await ctx.telegram.sendMessage(user.telegram_id, message, { parse_mode: 'HTML' });
          } catch {}
        }

        return ctx.reply('✅ Broadcast tugadi!');
      } catch (err) {
        console.error('Broadcast error:', err);
        return ctx.reply('❌ Xatolik yuz berdi.');
      }
    }

    // ======= RANGE INPUT =======
    if (ctx.session.waitingForRange) {
      const input = ctx.message.text.trim();
      let start, end;

      const rangeMatch = input.match(/^(\d+)\s*-\s*(\d+)$/);
      const singleMatch = input.match(/^(\d+)$/);

      if (rangeMatch) {
        start = Number(rangeMatch[1]);
        end = Number(rangeMatch[2]);
        if (start > end) return ctx.reply('❌ Range noto‘g‘ri, boshlanish raqami kichik bo‘lishi kerak.');
      } else if (singleMatch) {
        start = end = Number(singleMatch[1]);
      } else {
        return ctx.reply('❌ Noto‘g‘ri format. Iltimos: 1 yoki 1-100');
      }

      ctx.session.waitingForRange = false;
      ctx.session.broadcastRange = { start, end };
      ctx.session.waitingForMessage = true;

      return ctx.reply('✏️ Endi yubormoqchi bo‘lgan xabaringizni kiriting:');
    }

    // ======= MESSAGE INPUT =======
    if (ctx.session.waitingForMessage) {
      const message = ctx.message.text.trim();
      if (!message) return ctx.reply('❌ Xabar bo‘sh bo‘lishi mumkin emas.');

      ctx.session.waitingForMessage = false;
      const { start, end } = ctx.session.broadcastRange;

      try {
        const { data: users, error } = await supabase
          .from('registration')
          .select('telegram_id, order_number, full_name')
          .gte('order_number', start)
          .lte('order_number', end);

        if (error) throw error;
        if (!users || users.length === 0)
          return ctx.reply(`❌ Ushbu range bo‘yicha foydalanuvchi topilmadi.`);

        ctx.session.broadcastDraft = { users, message };

        const confirmKeyboard = Markup.inlineKeyboard([
          [Markup.button.callback('✅ Ha, yubor', 'confirm_broadcastById')],
          [Markup.button.callback('❌ Bekor qilish', 'cancel_broadcastById')],
        ]);

        await ctx.replyWithHTML(
          `🟢 Siz ${users.length} foydalanuvchiga quyidagi xabarni yubormoqchisiz:\n\n${message}`,
          confirmKeyboard
        );
      } catch (err) {
        console.error('BroadcastById preparation error:', err);
        await ctx.reply('❌ Xatolik yuz berdi. Iltimos, keyinroq urinib ko‘ring.');
      }

      return;
    }

    return next();
  });

  // ======= CONFIRMATION HANDLER =======
  bot.action('confirm_broadcastById', async (ctx) => {
    await ctx.answerCbQuery();
    const draft = ctx.session.broadcastDraft;
    if (!draft) return ctx.reply('❌ Hech qanday xabar topilmadi.');

    const { users, message } = draft;
    delete ctx.session.broadcastDraft;

    await ctx.reply(`📤 Xabar yuborilmoqda, iltimos kuting...`);

    const failed = [];
    const batchSize = 50;

    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (user) => {
          try {
            await ctx.telegram.sendMessage(user.telegram_id, message, { parse_mode: 'HTML' });
          } catch {
            failed.push(`${user.full_name} (order: ${user.order_number})`);
          }
        })
      );
      await new Promise((res) => setTimeout(res, 200));
    }

    if (failed.length === 0) {
      await ctx.reply(`✅ Xabar barcha foydalanuvchilarga muvaffaqiyatli yuborildi!`);
    } else {
      await ctx.reply(`⚠️ Ba'zi foydalanuvchilarga xabar yetib bormadi:\n${failed.join('\n')}`);
    }
  });

  bot.action('cancel_broadcastById', async (ctx) => {
    await ctx.answerCbQuery();
    delete ctx.session.broadcastDraft;
    await ctx.reply('❌ Xabar yuborish bekor qilindi.');
  });

  // ---------- /close command ----------
  bot.command('close', async (ctx) => {
    const userId = ctx.from.id;
    if (!config.ADMINS.includes(userId)) return ctx.reply('❌ Siz admin emassiz.');

    const { error } = await supabase
      .from('settings')
      .upsert({ key: 'registration_open', value: false });

    if (error) {
      console.error('Close registration error:', error);
      return ctx.reply('❌ Ro‘yxat yopish muvaffaqiyatsiz bo‘ldi.');
    }

    await ctx.reply('🛑 Ro‘yxatdan o‘tish muvaffaqiyatli yopildi.');
  });

  // ---------- /open command ----------
  bot.command('open', async (ctx) => {
    const userId = ctx.from.id;
    if (!config.ADMINS.includes(userId)) return ctx.reply('❌ Siz admin emassiz.');

    const { error } = await supabase
      .from('settings')
      .upsert({ key: 'registration_open', value: true });

    if (error) {
      console.error('Open registration error:', error);
      return ctx.reply('❌ Ro‘yxatni ochish muvaffaqiyatsiz bo‘ldi.');
    }

    await ctx.reply('✅ Ro‘yxatdan o‘tish muvaffaqiyatli ochildi.');
  });
};
