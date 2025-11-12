// visitorTracking.js
import { supabase } from '../supabase/supabase.js';

export async function trackStartClick(ctx) {
  const { id, username, first_name, last_name, language_code } = ctx.from;

  try {
    // 1️⃣ Check the most recent start_click record
    const { data: existing, error: fetchError } = await supabase
      .from('start_clicks')
      .select('created_at')
      .eq('telegram_id', id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (fetchError) throw fetchError;

    // 2️⃣ If there is a record, check the time difference
    if (existing && existing.length > 0) {
      const lastClick = new Date(existing[0].created_at);
      const hoursSinceLast = (Date.now() - lastClick.getTime()) / (1000 * 60 * 60);

      if (hoursSinceLast < 5) {
        console.log(`⏳ Skipped logging for ${username} (last click ${hoursSinceLast.toFixed(2)}h ago)`);
        return; // Skip insert if within 5h
      }
    }

    // 3️⃣ Otherwise insert new record
    const { error: insertError } = await supabase.from('start_clicks').insert([{
      telegram_id: id,
      username: username || '',
      first_name: first_name || '',
      last_name: last_name || '',
      language_code: language_code || ''
    }]);

    if (insertError) throw insertError;

    console.log(`✅ Logged /start click for ${username || id}`);

  } catch (error) {
    console.error('❌ Error tracking visitor:', error.message);
  }
}
