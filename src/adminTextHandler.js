// adminTextHandler.js
import { supabase } from './supabase/supabase.js';
import { Markup } from 'telegraf';

export const registerAdminTextHandler = (bot) => {
  bot.on('message', async (ctx, next) => {
    if (!ctx.session?.waitingForBroadcast) return next();

    ctx.session.waitingForBroadcast = false;

    const isPhoto = ctx.message.photo && ctx.message.photo.length > 0;
    const caption = ctx.message.caption || ctx.message.text || '';

    // Store message temporarily in session
    ctx.session.broadcastDraft = {
      isPhoto,
      fileId: isPhoto ? ctx.message.photo.at(-1).file_id : null,
      caption,
    };

    const confirmKeyboard = Markup.inlineKeyboard([
      [Markup.button.callback('✅ Ha, yubor', 'confirm_broadcast')],
      [Markup.button.callback('❌ Bekor qilish', 'cancel_broadcast')],
    ]);

    await ctx.replyWithHTML(
      `🟢 Quyidagi xabarni yubormoqchimisiz?\n\n${caption}`,
      confirmKeyboard
    );
  });

  // Confirmation handler
  bot.action('confirm_broadcast', async (ctx) => {
    await ctx.answerCbQuery();

    const draft = ctx.session.broadcastDraft;
    if (!draft) {
      return ctx.reply('❌ Hech qanday xabar topilmadi.');
    }

    const { data: users, error } = await supabase
      .from('registration')
      .select('telegram_id');

    if (error) {
      console.error('Supabase error:', error);
      return ctx.reply('❌ Foydalanuvchilarni olishda xatolik yuz berdi.');
    }

    const total = users.length;
    let success = 0;
    let failed = 0;

    await ctx.reply(`📊 ${total} ta foydalanuvchiga yuborilmoqda...`);

    for (const [index, user] of users.entries()) {
      try {
        if (draft.isPhoto) {
          await ctx.telegram.sendPhoto(user.telegram_id, draft.fileId, {
            caption: draft.caption,
            parse_mode: 'HTML',
          });
        } else {
          await ctx.telegram.sendMessage(user.telegram_id, draft.caption, {
            parse_mode: 'HTML',
          });
        }
        success++;
      } catch {
        failed++;
      }

      // Optional: small delay for better delivery (avoid hitting rate limit)
      await new Promise((res) => setTimeout(res, 80));
    }

    delete ctx.session.broadcastDraft;

    await ctx.reply(
      `✅ Yuborish yakunlandi!\n\n📬 Jami: ${success}`
    );
  });

  // Cancellation handler
  bot.action('cancel_broadcast', async (ctx) => {
    await ctx.answerCbQuery();
    delete ctx.session.broadcastDraft;
    await ctx.reply('❌ Xabar yuborish bekor qilindi.');
  });
};
