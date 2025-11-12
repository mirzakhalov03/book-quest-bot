import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Markup } from 'telegraf';
import { supabase } from '../supabase/supabase.js';
import { config } from '../config.js';
import { trackStartClick } from '../reports/visitorTracking.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Safely load audio file IDs
const audioFileIdsPath = path.resolve(__dirname, '../audioFileIds.json');
const audioFileIds = JSON.parse(fs.readFileSync(audioFileIdsPath, 'utf8'));

export const registerCommands = (bot) => {
  // 🟢 START COMMAND
  bot.start(async (ctx) => {
    await trackStartClick(ctx);

    try {
      const telegramId = ctx.from.id;

      const { data: existingUser, error } = await supabase
        .from('registration')
        .select('id, full_name, order_number')
        .eq('telegram_id', telegramId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // ignore "no rows" error

      const mainKeyboard = Markup.keyboard([
        ['📖 Book Info', '🎧 Book Audios', 'ℹ️ About Us'],
      ])
        .resize()
        .persistent();

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
            [
              `Iltimos, loyihada ushbu botdan foydalanish qoidalari bilan tanishib chiqing:`,
              ``,
              `— Musobaqa yakunlanmaguncha botni o‘chirib yubormang.`,
              `— Kitob o‘qish muddati tugagach, sizga test havolasi shu bot orqali yuboriladi.`,
            ].join('\n')
          ),
        ]);

        return;
      }

      // 🆕 New User Registration Prompt
      await ctx.replyWithHTML(
        [
          `Assalomu alaykum, kitobxon do‘stim! 😊`,
          `<b>📚 Book Quest loyihasiga xush kelibsiz!</b>`,
          ``,
          `Bu loyiha orqali biz har oy yangi kitobni birgalikda o‘qib, yakunda qisqa test orqali bilimimizni sinaymiz.`,
          ``,
          `Ro‘yxatdan o‘tishni xohlaysizmi?`,
        ].join('\n'),
        Markup.inlineKeyboard([
          [Markup.button.callback('✅ Ha, ro‘yxatdan o‘taman', 'confirm_yes')],
          [Markup.button.callback('❌ Yo‘q, keyinroq', 'confirm_no')],
        ])
      );
    } catch (err) {
      console.error('⚠️ start error:', err);
      await ctx.reply('Xatolik yuz berdi, iltimos keyinroq urinib ko‘ring.');
    }
  });

  // 📖 BOOK INFO
  bot.hears('📖 Book Info', async (ctx) => {
    const photoPath = path.resolve(__dirname, '../imgs/book_photo.jpg');

    const caption = [
      `📖 <b>SOHILSIZ DENGIZ</b>`,
      `✍️ Ahmad Muhammad Tursun`,
      ``,
      `📊 <b>Janr:</b> Ilmiy-tarixiy roman`,
      `📄 <b>Sahifalar:</b> 254`,
      `🕰 <b>O‘qish muddati:</b> 10 kun`,
      `🎯 <b>Qiyinlik darajasi:</b> O‘rta`,
      `🌐 <b>Til:</b> O‘zbek`,
      ``,
      `💭 <i>"Sohilsiz Dengiz" — Ahmad Muhammad Tursun tomonidan yozilgan ilmiy-tarixiy roman. Kitob mashhur muhaddis Imom al-Buxoriyning hayoti, ilmiy izlanishlari va ustoz-shogird aloqalarini badiiy tarzda ochib beradi.</i>`,
      ``,
      `📍 <b>QAYERDAN TOPISH MUMKIN?</b>`,
      ``,
      `<b>📚 QOG‘OZ KITOB:</b>`,
      `🏪 <a href="https://t.me/HilolNashr/28905">Hilol Nashr</a> va kitob do‘konlar`,
      `💰 Narx: 43,000 – 50,000 so‘m`,
      ``,
      `<b>🎧 AUDIO KITOB:</b>`,
      `– Book Quest Bot`,
      `– <a href="https://youtu.be/sEp36sGbNDQ?si=6o2JCl_YJm2ZwFlX">YouTube</a>`,
      `– Telegram Audio Kitob kanallari`,
    ].join('\n');

    await ctx.replyWithPhoto({ source: photoPath }, { caption, parse_mode: 'HTML' });
  });

  // 🎧 BOOK AUDIOS MENU
  bot.hears('🎧 Book Audios', async (ctx) => {
    const audioMenu = Markup.keyboard([
      ['Sohilsiz Dengiz 1–7', 'Sohilsiz Dengiz 8–15', 'Sohilsiz Dengiz 16–22'],
      ['🔙 Orqaga'],
    ])
      .resize()
      .persistent();

    await ctx.reply('🎧 Quyidagi bo‘limlardan birini tanlang:', audioMenu);
  });

  // 🎵 RANGE SELECTIONS
  bot.hears('Sohilsiz Dengiz 1–7', (ctx) => sendAudioRange(ctx, 1, 7));
  bot.hears('Sohilsiz Dengiz 8–15', (ctx) => sendAudioRange(ctx, 8, 15));
  bot.hears('Sohilsiz Dengiz 16–22', (ctx) => sendAudioRange(ctx, 16, 22));

  // 🔙 BACK BUTTON
  bot.hears('🔙 Orqaga', async (ctx) => {
    const mainKeyboard = Markup.keyboard([
      ['📖 Book Info', '🎧 Book Audios', 'ℹ️ About Us'],
    ])
      .resize()
      .persistent();

    await ctx.reply('🔙 Asosiy menyuga qaytdingiz.', mainKeyboard);
  });

  // ℹ️ ABOUT US
  bot.hears('ℹ️ About Us', async (ctx) => {
    await ctx.replyWithMediaGroup([
      {
        type: 'photo',
        media: { source: path.resolve(__dirname, '../imgs/abdulakhad.jpg') },
        caption: [
          `<b>📚 Book Quest</b> — 2024-yilda ikkita kitobxon do‘stlar <b>Abdulakhad Vokhabov</b> va <b>Javohir Mirzakhalov</b> tomonidan asos solingan loyiha.`,
          ``,
          `🎯 Maqsad — kitob o‘qishga bo‘lgan qiziqishni kuchaytirish va o‘qish madaniyatini rivojlantirish.`,
          ``,
          `<b>Bizning Jamoa:</b>`,
          `<blockquote><b>👨‍💻 <a href="https://t.me/vokhabov27">Abdulakhad Vokhabov</a></b></blockquote>`,
          `<b>Co-Founder & Organizer</b>`,
          `🎓 Millat Umidi University, Computer Science`,
          `💼 Ingliz tili ustoz va freelance dasturchi`,
          ``,
          `<blockquote><b>👨‍💻 <a href="https://t.me/mirzakhalov03">Javohir Mirzakhalov</a></b></blockquote>`,
          `<b>Co-Founder & Manager</b>`,
          `🎓 INHA University, Computer Science`,
          `🚀 SATashkent’da Frontend dasturchi`,
        ].join('\n'),
        parse_mode: 'HTML',
      },
      {
        type: 'photo',
        media: { source: path.resolve(__dirname, '../imgs/javohir.jpg') },
      },
    ]);
  });
};

// 🧩 HELPER FUNCTION — SEND AUDIO RANGE
async function sendAudioRange(ctx, start, end) {
  try {
    const userChatId = ctx.chat.id;

    await ctx.reply(`🔹 <b>${start}–${end}</b>-qismlar yuborilmoqda...`, {
      parse_mode: 'HTML',
    });

    const selected = audioFileIds.filter((file) => {
      const match = file.file_name.match(/^(\d+)/);
      if (!match) return false;
      const num = parseInt(match[1], 10);
      return num >= start && num <= end;
    });

    if (selected.length === 0) {
      return ctx.reply('⚠️ Ushbu oraliqda audio topilmadi.');
    }

    for (const audio of selected) {
      await ctx.telegram.sendAudio(userChatId, audio.file_id, {
        caption: audio.file_name.replace('.mp3', ''),
      });
    }

    await ctx.reply('✅ Barcha audios yuborildi.');
  } catch (err) {
    console.error('Audio send error:', err);
    await ctx.reply('❌ Audio yuborishda xatolik yuz berdi.');
  }
}
