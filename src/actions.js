export const registerActions = (bot) => {
    bot.action('confirm_no', async (ctx) => {
      await ctx.answerCbQuery();
      await ctx.reply(
        "Hop mayli, ixtiyoringiz 😊\nFikringizni o‘zgartirsangiz, qayta /start ni bosing."
      );
    });
  
    bot.action('confirm_yes', async (ctx) => {
      await ctx.answerCbQuery();
      ctx.session ??= {};
      ctx.session.waitingForName = true;
      await ctx.reply(
        "Iltimos, to‘liq ismingizni kiriting (ism va familiya). Masalan: *Javohir Mirzakhalov*",
        { parse_mode: 'Markdown' }
      );
    });
  };
  