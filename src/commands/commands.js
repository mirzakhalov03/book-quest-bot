import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Markup } from 'telegraf';
import { supabase } from '../supabase/supabase.js';
import { config } from '../config.js';
import { trackStartClick } from '../reports/visitorTracking.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const userSendingStatus = new Map(); // chatId → boolean


// ✅ Safely load audio file IDs
let audioFileIds = [];
try {
  const audioFileIdsPath = path.resolve(__dirname, '../audioFileIds.json');
  const rawData = fs.readFileSync(audioFileIdsPath, 'utf8');
  audioFileIds = JSON.parse(rawData);
} catch (err) {
  console.warn('⚠️ Warning: Could not load audioFileIds.json:', err.message);
  audioFileIds = [];
}

// ✅ Helper: Main Keyboard
const mainKeyboard = Markup.keyboard([
  ['📖 Kitob Haqida'],
  ["🏆 Sovg'alar"],
  ['🎧 Kitob Audiosi'],
  ['ℹ️ Jamoa Haqida']
])
  .resize()
  .persistent();

// ✅ Track cooldown to prevent double /start trigger
const startCooldown = new Map(); // userId -> timestamp (ms)
const START_COOLDOWN_MS = 2000; // 2 seconds buffer

export const registerCommands = (bot) => {
  // 🟢 START COMMAND
  bot.start(async (ctx) => {
    const userId = ctx.from?.id;
    const now = Date.now();

    // Prevent multiple triggers in short time
    if (startCooldown.has(userId) && now - startCooldown.get(userId) < START_COOLDOWN_MS) {
      return; // ignore duplicate start
    }
    startCooldown.set(userId, now);

    await trackStartClick(ctx);

    try {
      const telegramId = ctx.from.id;

      const { data: existingUser, error } = await supabase
        .from('registration')
        .select('id, full_name, order_number')
        .eq('telegram_id', telegramId)
        .maybeSingle();

      if (error) throw error;

      if (existingUser) {
        const paddedOrder = String(existingUser.order_number).padStart(3, '0');

        // Send messages in strict order
        await ctx.reply(
          `Assalomu alaykum, ${existingUser.full_name}! 😊\n` +
            `Siz allaqachon ro‘yxatdan o‘tgansiz ✅\n` +
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

        return;
      }

      // 🆕 New User Registration
      await ctx.replyWithHTML(
        [
          `Assalomu alaykum, kitobxon do‘stim! 😊`,
          `<b>📚 Book Quest loyihasiga xush kelibsiz!</b>`,
          ``,
          `Bu loyihada - kitob o'qish orqali sovg'alar yutib olish imkoniyatiga ega bo'lasiz.`,
          ``,
          `Ro‘yxatdan o‘tishni xohlaysizmi?`,
        ].join('\n'),
        Markup.inlineKeyboard([
          [Markup.button.callback('✅ Ha, ro‘yxatdan o‘taman', 'confirm_yes')],
          [Markup.button.callback('❌ Yo‘q, keyinroq', 'confirm_no')],
        ])
      );
    } catch (err) {
      console.error('⚠️ /start error:', err);
      await ctx.reply('Xatolik yuz berdi, iltimos keyinroq urinib ko‘ring, yoki @mirzakhalov03 bilan bog‘laning.');
    }
  });

  // 📖 BOOK INFO
  bot.hears('📖 Kitob Haqida', async (ctx) => {
    const photoPath = path.resolve(__dirname, '../imgs/book_photo.jpg');
    const caption = [
      `📖 <b>SOHILSIZ DENGIZ</b>`,
      `✍️ Ahmad Muhammad Tursun`,
      ``,
      `📊 <b>Janr:</b> Ilmiy-tarixiy roman`,
      `📄 <b>Sahifalar:</b> 254`,
      `🌐 <b>Tili:</b> O‘zbekcha`,
      `🕰 <b>O‘qish muddati:</b> 20-noyabrdan 30-noyabrgacha (10 kun)`,
      ``,
      `💭 <i>"Sohilsiz Dengiz" — Ahmad Muhammad Tursun tomonidan yozilgan ilmiy-tarixiy roman. Kitob mashhur muhaddis Imom al-Buxoriyning hayoti, ilmiy izlanishlari va ustoz-shogird aloqalarini badiiy tarzda ochib beradi.</i>`,
      ``,
      `📍 <b>QAYERDAN TOPISH MUMKIN?</b>`,
      ``,
      `<b>📚 QOG‘OZ KITOB:</b>`,
      `– <a href="https://t.me/HilolNashr/28905">Hilol Nashr</a> yoki boshqa kitob do‘konlaridan`,
      `– Narx: 43,000 – 50,000 so‘m`,
      ``,
      `<b>📄 PDF KITOB: </b>`,
      `– Hilol eBook ilovasida`,
      ``,
      `<b>🎧 AUDIO KITOB:</b>`,
      `– Book Quest boti orqali`,
      `– <a href="https://youtu.be/sEp36sGbNDQ?si=6o2JCl_YJm2ZwFlX">YouTube</a>`,
    ].join('\n');

    await ctx.replyWithPhoto({ source: photoPath }, { caption, parse_mode: 'HTML' });
  });

  bot.hears("🏆 Sovg'alar", async (ctx) => {
    const photoPath = path.resolve(__dirname, '../imgs/prizes_final.jpeg');
    const caption = [
      `🏆 <b>SOVG'ALAR</b>`,
      ``,
      `🎁 Kitob o'qish orqali quyidagi sovg'alarni yutib olish imkoniyatiga ega bo'lasiz:`,
      `<blockquote>`,
      `<b>🥇 1. Smartwatch + “Xalqa” kitobi</b> `,
      `<b>🥈 2. Quloqchin + “Falastin” kitobi</b> `,
      `<b>🥉 3. Termos + “Muqaddima” kitobi</b>`,
      `<b>🏅 4. Telegram Premium + “Alloh sari 20 bekat” kitobi</b>`,
      `<b>🏅 5. Mutolaa Premium + "Bugun bomdod o'qidingizmi?" kitobi</b>`,
      `</blockquote>`,
      ``,
      `📅 G'oliblar tanlov yakunida e'lon qilinadi.`,
      ``,
      `📢 Eslatma: Sovg'alarni yutib olish uchun kitobni oxirigacha o'qish va testdan yuqori o'rin olish talab etiladi.`,
      `<i>Sovg'alar faqatgina Namangan va Toshkent hududlariga bepulga yetkazib beriladi.</i>`,
      ``,
      `@bookquest_bot`,
    ].join('\n');
    await ctx.replyWithPhoto({ source: photoPath }, { caption, parse_mode: 'HTML' });
    })

  // 🎧 BOOK AUDIOS MENU
  bot.hears('🎧 Kitob Audiosi', async (ctx) => {
    const audioMenu = Markup.keyboard([
      ['Sohilsiz Dengiz 1–7'],
      ['Sohilsiz Dengiz 8–15'],
      ['Sohilsiz Dengiz 16–22'],
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
    await ctx.reply('⏺️ Asosiy menyuga qaytdingiz.', mainKeyboard);
  });

  // ℹ️ ABOUT US
  bot.hears('ℹ️ Jamoa Haqida', async (ctx) => {
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
          ``,
          `<b>Maslahatchi va Homiy:</b>`,
          `<blockquote><b>💰<a href="https://t.me/maxmudjon_571">Mahmudjon Maxmudov</a></b></blockquote>`
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
  const chatId = ctx.chat.id;

  // If user already sending → block
  if (userSendingStatus.get(chatId)) {
    return ctx.reply("⏳ Iltimos, oldingi audioning tugashini kuting.");
  }

  userSendingStatus.set(chatId, true); // lock
  try {
    await ctx.reply(`🔹 <b>${start}–${end}</b>-qismlar yuborilmoqda...`, {
      parse_mode: 'HTML',
    });

    const selected = audioFileIds.filter((file) => {
      const match = file.file_name.match(/^(\d+)/);
      if (!match) return false;
      const num = parseInt(match[1], 10);
      return num >= start && num <= end;
    });

    if (!selected.length) {
      return ctx.reply('⚠️ Ushbu oraliqda audio topilmadi. Iltimos, @mirzakhalov03 bilan bog‘laning.');
    }

    for (const audio of selected) {
      await ctx.telegram.sendAudio(chatId, audio.file_id, {
        caption: audio.file_name.replace('.mp3', ''),
      });
      await new Promise(r => setTimeout(r, 150));
    }

  } catch (err) {
    console.error('Audio send error:', err);
    await ctx.reply('❌ Audio yuborishda xatolik yuz berdi.');
  } finally {
    userSendingStatus.set(chatId, false); // unlock
  }
}
