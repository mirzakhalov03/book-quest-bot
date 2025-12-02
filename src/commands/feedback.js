// src/commands/feedback.js
import { Markup } from "telegraf";
import { supabase } from "../supabase/supabase.js";

const ADMIN_CHAT_ID = process.env.GROUP_CHAT_ID;

// Local state
const pendingRatings = new Map(); // chatId -> true
const awaitingFeedback = new Map(); // chatId -> true

export const registerFeedbackFeature = (bot) => {

  // 🔹 /fikrlar command
  bot.command("fikrlar", async (ctx) => {
    try {
      const chatId = ctx.chat.id;
      const telegramId = ctx.from.id;

      // Check if user already rated
      const { data: existing, error } = await supabase
        .from("feedback")
        .select("*")
        .eq("telegram_id", telegramId)
        .maybeSingle();

      if (error) {
        console.error("Supabase error:", error);
        return ctx.reply("⚠️ Xatolik yuz berdi, iltimos keyinroq urinib ko‘ring.");
      }

      if (existing) {
        // Already rated → allow optional feedback
        await ctx.reply(
          "😊 Siz allaqachon baho bergansiz.\n\n" +
          "Agar xohlasangiz, qo‘shimcha fikr yoki mulohaza yozib qoldirishingiz mumkin. " +
          "Shunchaki shu chatga yozing."
        );
        awaitingFeedback.set(chatId, true);
        return;
      }

      // New rating → show inline buttons
      await ctx.reply(
        "🎯Loyihamizni baholab, o'z fikringizni yozib qoldirishingiz mumkin. Quyidagi baholardan birini tanlang:",
        Markup.inlineKeyboard([
          [1, 3, 5, 8, 10].map((n) => Markup.button.callback(`${n} ⭐️`, `rate_${n}`))
        ])
      );

      pendingRatings.set(chatId, true);
    } catch (err) {
      console.error("Unhandled error in /fikrlar:", err);
      await ctx.reply("❌ Xatolik yuz berdi, iltimos keyinroq urinib ko‘ring.");
    }
  });

  // 🔹 Handle rating button click
  bot.on("callback_query", async (ctx) => {
    const chatId = ctx.chat.id;
    const telegramId = ctx.from.id;

    if (!pendingRatings.get(chatId)) return; // Ignore if not in rating state

    const ratingMatch = ctx.callbackQuery.data.match(/^rate_(\d+)$/);
    if (!ratingMatch) return;

    const rating = parseInt(ratingMatch[1], 10);

    try {
      // Save rating in Supabase
      const { error } = await supabase.from("feedback").insert({
        telegram_id: telegramId,
        rating,
      });

      if (error) {
        console.error("Supabase Insert Error:", error);
        await ctx.reply("⚠️ Baho saqlanmadi, iltimos keyinroq urinib ko‘ring.");
        return;
      }

      // Confirmation to user
      await ctx.reply(
        `✅ Sizning bahoyingiz (${rating} ⭐️) qabul qilindi!\n` +
        "\n" +
        "Fikr va takliflaringiz bo'lsa, iltimos, yozib qoldiring. "
      );

      // Forward to admin
      try {
        await ctx.telegram.sendMessage(
          ADMIN_CHAT_ID,
          `📥 *Yangi fikr qoldirildi!*\n\n` +
          `👤 *Foydalanuvchi:* ${ctx.from.first_name} ${ctx.from.last_name || ""}\n` +
          `🔗 *Username:* ${ctx.from.username ? "@" + ctx.from.username : "yo'q"}\n` +
          `🆔 *Telegram ID:* ${telegramId}\n` +
          `⭐️ *Bahosi:* ${rating}`,
          { parse_mode: "Markdown" }
        );
      } catch (err) {
        console.error("Failed to send feedback to admin:", err);
      }

      // Clean up
      pendingRatings.delete(chatId);
      awaitingFeedback.set(chatId, true); // allow optional feedback

    } catch (err) {
      console.error("Error handling rating:", err);
      await ctx.reply("❌ Xatolik yuz berdi, iltimos keyinroq urinib ko‘ring.");
    } finally {
      await ctx.answerCbQuery(); // remove "loading" on button
    }
  });

  // 🔹 Capture optional additional feedback
  bot.on("text", async (ctx) => {
    const chatId = ctx.chat.id;

    if (!awaitingFeedback.get(chatId)) return;

    const telegramId = ctx.from.id;
    const userMessage = ctx.message.text;

    try {
      // Update existing record with feedback
      const { error } = await supabase
        .from("feedback")
        .update({ feedback: userMessage })
        .eq("telegram_id", telegramId);

      if (error) {
        console.error("Failed to save additional feedback:", error);
        return await ctx.reply("❌ Fikringizni saqlashda xatolik yuz berdi.");
      }

      await ctx.reply("✅ Fikringiz qabul qilindi. Rahmat!");

      // Send to admin
      try {
        await ctx.telegram.sendMessage(
          ADMIN_CHAT_ID,
          `📥 *Yangi qo‘shimcha fikr qoldirildi!*\n\n` +
          `👤 *Foydalanuvchi:* ${ctx.from.first_name} ${ctx.from.last_name || ""}\n` +
          `🔗 *Username:* ${ctx.from.username ? "@" + ctx.from.username : "yo'q"}\n` +
          `🆔 *Telegram ID:* ${telegramId}\n` +
          `💬 *Fikri:* ${userMessage}`,
          { parse_mode: "Markdown" }
        );
      } catch (err) {
        console.error("Failed to send additional feedback to admin:", err);
      }
    } catch (err) {
      console.error("Error processing additional feedback:", err);
      await ctx.reply("❌ Xatolik yuz berdi, iltimos keyinroq urinib ko‘ring.");
    } finally {
      awaitingFeedback.delete(chatId);
    }
  });
};
