import { supabase } from './supabase/supabase.js';
import { Markup } from 'telegraf';

export const registerAdminTextHandler = (bot) => {
    bot.on('message', async (ctx, next) => {   // ← add next
      if (!ctx.session?.waitingForBroadcast) {
        return next(); // ✅ Pass control to next handlers (like textHandler)
      }
  
      ctx.session.waitingForBroadcast = false;
  
      const usersResult = await supabase.from('registration').select('telegram_id');
      if (usersResult.error) {
        console.error('Supabase error:', usersResult.error);
        return ctx.reply('❌ Foydalanuvchilarni olishda xatolik yuz berdi.');
      }
  
      const users = usersResult.data;
  
      // Prepare message
      const isPhoto = ctx.message.photo && ctx.message.photo.length > 0;
      const caption = ctx.message.caption || ctx.message.text || '';
      let replyMarkup = undefined;
  
      if (ctx.message.reply_to_message?.text?.includes('Tugma:')) {
        const buttonData = ctx.message.reply_to_message.text.split('Tugma:')[1];
        if (buttonData) {
          const [buttonText, buttonUrl] = buttonData.split(':');
          replyMarkup = Markup.inlineKeyboard([
            Markup.button.url(buttonText.trim(), buttonUrl.trim())
          ]);
        }
      }
  
      for (let user of users) {
        try {
          if (isPhoto) {
            const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
            await ctx.telegram.sendPhoto(user.telegram_id, fileId, {
              caption,
              parse_mode: 'HTML',
              reply_markup: replyMarkup
            });
          } else {
            await ctx.telegram.sendMessage(user.telegram_id, caption, {
              parse_mode: 'HTML',
              reply_markup: replyMarkup
            });
          }
        } catch (err) {
          console.error(`Xabar yuborilmadi: ${user.telegram_id}`, err);
        }
      }
  
      await ctx.reply('✅ Xabar barcha foydalanuvchilarga yuborildi.');
    });
  };
  