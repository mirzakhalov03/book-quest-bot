// activityTracking.js
import { supabase } from '../supabase/supabase.js';

/**
 * Logs any user interaction into Supabase
 * @param {Object} ctx - Telegraf context
 * @param {String} action - Main event (e.g., "Clicked Button", "Sent Message", "Started Bot")
 * @param {String} [details] - Optional extra info
 */
export async function logUserAction(ctx, action, details = '') {
    try {
      const { id, username, first_name, last_name } = ctx.from || {};
      const full_name = [first_name, last_name].filter(Boolean).join(' ');
  
      supabase.from('user_activity').insert([{
        telegram_id: id,
        username: username || '',
        full_name,
        action,
        details,
      }]).then(({ error }) => {
        if (error) console.error('❌ Logging error:', error.message);
      });
  
    } catch (err) {
      console.error('❌ logUserAction failed:', err.message);
    }
  }
  
  export function registerActivityTracking(bot) {
    bot.on('message', async (ctx, next) => {
      let content = '';
  
      if (ctx.message.text) {
        content = ctx.message.text;
      } else if (ctx.message.caption) {
        content = ctx.message.caption;
      } else if (ctx.message.sticker) {
        content = `[Sticker: ${ctx.message.sticker.emoji || 'unknown'}]`;
      } else if (ctx.message.contact) {
        content = `[Contact: ${ctx.message.contact.phone_number}]`;
      } else if (ctx.message.location) {
        content = `[Location: ${ctx.message.location.latitude}, ${ctx.message.location.longitude}]`;
      } else {
        content = '[Other message type]';
      }
  
      await logUserAction(ctx, 'Message', content);
      await next();
    });
  
    bot.on('callback_query', async (ctx, next) => {
      await logUserAction(ctx, 'Button Click', ctx.callbackQuery.data);
      await next();
    });
  
    bot.command(/.*/, async (ctx, next) => {
      await logUserAction(ctx, 'Command', ctx.message.text);
      await next();
    });
  }