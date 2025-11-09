// import { Telegraf, Markup, session } from 'telegraf';
// import dotenv from 'dotenv';
// import { createClient } from '@supabase/supabase-js';

// dotenv.config();

// // --- Initialize Supabase ---
// const supabase = createClient(
//   process.env.SUPABASE_URL,
//   process.env.SUPABASE_ANON_KEY
// );

// // --- Initialize Telegram Bot ---
// const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// // --- Enable Telegraf built-in session ---
// bot.use(session());

// // --- Replace with your group chat ID ---
// const GROUP_CHAT_ID = process.env.GROUP_CHAT_ID;

// // --- Helper: validate & auto-capitalize full name ---
// const formatFullName = (name) => {
//   const parts = name.trim().split(/\s+/);

//   // Each part must be >=2 letters and only letters (Latin/Cyrillic)
//   // const regex = /^[A-Za-zА-Яа-яЎўҚқҒғҲҳʼ'‘`]+$/u;
//   // for (let p of parts) {
//   //   if (p.length < 2 || !regex.test(p)) return null;
//   // }

//   // Capitalize first letter of each word
//   const capitalized = parts.map(
//     (p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()
//   );

//   return capitalized.join(' ');
// };

// // --- /start command ---
// bot.start(async (ctx) => {
//   try {
//     const telegram_id = ctx.from.id;

//     // Check if user already registered
//     const { data: existingUser } = await supabase
//       .from('registration')
//       .select('id, full_name, order_number')
//       .eq('telegram_id', telegram_id)
//       .single();

//     if (existingUser) {
//       const paddedOrder = String(existingUser.order_number).padStart(3, '0');
//       await Promise.all([
//         ctx.reply(
//           `Assalomu alaykum, ${existingUser.full_name}! 😊\n` +
//           `Siz allaqachon ro‘yxatdan o‘tgansiz ✅\n` +
//           `Sizning tartib raqamingiz: #${paddedOrder}`
//         ),
//         ctx.reply(
//           `Iltimos, loyihada ushbu botdan foydalanish qoidalari bilan tanishib chiqing:\n\n` +
//           `— Musobaqa yakunlanmaguncha botni o‘chirib yubormang.\n` +
//           `— Kitob o‘qish muddati tugagach, sizga test havolasi shu bot orqali yuboriladi.`
//         ),
//       ]);
//       return;
//     }

//     // New user intro
//     await ctx.replyWithHTML(
//       `Assalomu alaykum, kitobxon do‘stimiz! 😊\n` +
//       `<b>📚 Book Quest loyihasiga xush kelibsiz!</b>\n\n` +
//       `Bu loyiha orqali biz har oy yangi kitobni birgalikda o‘qib, yakunda qisqa test orqali bilimimizni sinaymiz.\n\n` +
//       `Ro‘yxatdan o‘tishni xohlaysizmi?`,
//       Markup.inlineKeyboard([
//         [Markup.button.callback('✅ Ha, ro‘yxatdan o‘taman', 'confirm_yes')],
//         [Markup.button.callback('❌ Yo‘q, keyinroq', 'confirm_no')],
//       ])
//     );
//   } catch (err) {
//     console.error('⚠️ start error:', err);
//     await ctx.reply('Xatolik yuz berdi, iltimos keyinroq urinib ko‘ring.');
//   }
// });

// // --- User declines registration ---
// bot.action('confirm_no', async (ctx) => {
//   await ctx.answerCbQuery();
//   await ctx.reply(
//     "Hop mayli, ixtiyoringiz 😊\nFikringizni o‘zgartirsangiz, qayta /start ni bosing."
//   );
// });

// // --- User confirms registration ---
// bot.action('confirm_yes', async (ctx) => {
//   await ctx.answerCbQuery();

//   // initialize session
//   ctx.session ??= {};
//   ctx.session.waitingForName = true;

//   await ctx.reply(
//     "Iltimos, to‘liq ismingizni kiriting (ism va familiya). Masalan: *Javohir Mirzakhalov*",
//     { parse_mode: 'Markdown' }
//   );
// });

// // --- Text handler (waiting for full name) ---
// bot.on('text', async (ctx) => {
//   if (!ctx.session?.waitingForName) return;

//   const rawName = ctx.message.text.trim();
//   const full_name = formatFullName(rawName);

//   if (!full_name) {
//     return await ctx.reply(
//       "Ismingiz to‘liq yoki to‘g‘ri shaklda kiritilmadi.\n" +
//       "Iltimos, ism va familiyangizni faqat harflardan tashkil qilingan holda yozing.\n" +
//       "Masalan: *Javohir Mirzakhalov*",
//       { parse_mode: 'Markdown' }
//     );
//   }

//   const telegram_id = ctx.from.id;
//   const username = ctx.from.username || 'no_username';

//   // Count total registered users
//   const { count, error: countError } = await supabase
//     .from('registration')
//     .select('*', { count: 'exact', head: true });

//   if (countError) {
//     console.error('Count error:', countError);
//     return await ctx.reply('Xatolik yuz berdi. Iltimos keyinroq urinib ko‘ring.');
//   }

//   const order_number = (count || 0) + 1;
//   const paddedOrder = String(order_number).padStart(3, '0');

//   // Insert new user
//   const { error: insertError } = await supabase.from('registration').insert([
//     { telegram_id, username, full_name, order_number },
//   ]);

//   if (insertError) {
//     console.error('Insert error:', insertError);
//     return await ctx.reply('Ro‘yxatdan o‘tishda xatolik yuz berdi.');
//   }

//   // Confirmation messages
//   const messages = [
//     ctx.reply(
//       `${full_name}, kitobxonlar safimizga qo‘shilganingizdan xursandmiz! 😊\n` +
//       `Siz muvaffaqiyatli ro‘yxatdan o‘tdingiz ✅\n` +
//       `Sizning tartib raqamingiz: #${paddedOrder}`
//     ),
//     ctx.reply(
//       `Iltimos, ushbu botdan foydalanish qoidalariga e’tibor bering:\n` +
//       `— Musobaqa yakunlanmaguncha botni o‘chirib yubormang.\n` +
//       `— Kitob o‘qish muddati tugagach, test havolasi shu bot orqali yuboriladi.`
//     ),
//   ];

//   // Notify group
//   if (GROUP_CHAT_ID) {
//     messages.push(
//       bot.telegram.sendMessage(
//         GROUP_CHAT_ID,
//         `🆕 Yangi ishtirokchi ro‘yxatdan o‘tdi!\n\n👤 Ism: ${full_name}\n🆔 Telegram: @${username}\n📋 Tartib raqami: #${paddedOrder}`
//       )
//     );
//   }

//   await Promise.all(messages);
//   ctx.session.waitingForName = false;
// });

// // --- Launch bot ---
// bot.launch();
// console.log('🚀 Book Quest Registration Bot ishga tushdi (built-in session).');
