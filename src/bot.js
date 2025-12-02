import { Telegraf, session } from 'telegraf';
import { config } from './config.js';
import { registerCommands } from './commands/commands.js';
import { registerActions } from './actions.js';
import { registerTextHandler } from './textHandler.js';
import { registerAdminCommands } from './commands/adminCommands.js';
import { registerAdminTextHandler } from './adminTextHandler.js';
import { registerActivityTracking } from './reports/activityTracking.js';
import { registerFeedbackFeature } from './commands/feedback.js';

const bot = new Telegraf(config.TELEGRAM_BOT_TOKEN);
bot.use(session());

registerActivityTracking(bot);

// Register separate logic
registerCommands(bot);
registerActions(bot);


registerAdminCommands(bot);
registerAdminTextHandler(bot);
registerFeedbackFeature(bot);
registerTextHandler(bot);



bot.launch();
console.log('🚀 Book Quest Registration Bot launched successfully.');
