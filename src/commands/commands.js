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
    await ctx.replyWithPhoto(
      { source: '/Users/macbookuz/Desktop/Book Quest/book-quest-bot/book_photo.jpg' }, // or use a URL
      {
        caption: `📖 <b>SOHILSIZ DENGIZ</b>
✍️ Ahmad Muhammad Tursun

📊 <b>Janr:</b> Ilmiy-tarixiy roman
📄 <b>Sahifalar:</b> 254
🕰 <b>O'qish muddati:</b> 10 kun
🎯 <b>Qiyinlik darajasi:</b> O'rta
🌐 <b>Til:</b> O'zbek

💭 <i>"Sohilsiz Dengiz" — Ahmad Muhammad Tursun tomonidan yozilgan ilmiy-tarixiy roman. Kitob mashhur muhaddis Abu Abdulloh Muhammad ibn Ismoil al-Buxoriyning hayoti, ilmiy izlanishlari va ustoz-shogird aloqalarini badiiy uslubda ochib beradi. Cheksiz dengiz kabi insoniy izlanishlar, orzu va ma’rifat mavzulari kitob sahifalarida jonlanadi.</i>

📍 <b>QAYERDAN TOPISH MUMKIN?</b>

<blockquote>📚 <b>QOG'OZ KITOB:</b></blockquote>
🏪 <a href="https://t.me/HilolNashr/28905">Hilol Nashr</a> va kitob do'konlar
💰 Narx: 43,000 - 50,000 so'm

<blockquote>🎧 <b>AUDIO KITOB:</b></blockquote>
- Book Quest Bot
- <a href="https://youtu.be/sEp36sGbNDQ?si=6o2JCl_YJm2ZwFlX">YouTube</a>
- Telegram Audio Kitob kanallari`,
        parse_mode: 'HTML',
      }
    );
  });
  
  
  bot.hears('🎧 Book Audios', async (ctx) => {
    await ctx.replyWithHTML('Soon, book audios are coming...\n\nStay with us!😊')
  })
  bot.hears('ℹ️ About Us', async (ctx) => {
    await ctx.replyWithHTML(`
  <b>📚 Book Quest</b> — Book Quest 2024-yilda ikkita kitobxon do'stlar - <b>Abdulakhad Vokhabov</b> va <b>Javohir Mirzakhalov</b> tomonidan asos solindi.
  
  🎯 Maqsadimiz — insonlar orasida kitob o‘qishga bo‘lgan qiziqishni kuchaytirish 
  va o‘qish madaniyatini rivojlantirishdir.
  
<b>Bizning Jamoa:</b>
  <blockquote><b>👨‍💻 Abdulakhad Vokhabov</b></blockquote>
  <b>Co-Founder & Organizer</b>
  🎓 Millat Umidi University, Computer Science (1-bosqich talabasi)
  💼 Frontend Developer sifatida faoliyat olib boradi.  
  <em>"Kitob — bu eng arzon sayohat, lekin eng qimmatli tajriba."</em>

  ———————————————

  <blockquote><b>👨‍💻 Javohir Mirzakhalov</b></blockquote>
  <b>Co-Founder & Manager</b>
  🎓 Inha University, Computer Science (2-bosqich talabasi)
  🚀 SaTashkent StartUp loyihasida faoliyat yuritadi.  
  <em>"Yaxshi kitob — yaxshi do‘st kabi."</em>
    `)
  })
};
