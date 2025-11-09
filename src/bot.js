import { Telegraf, session } from 'telegraf';
import { config } from './config.js';
import { registerCommands } from './commands/commands.js';
import { registerActions } from './actions.js';
import { registerTextHandler } from './textHandler.js';
import { registerAdminCommands } from './commands/adminCommands.js';
import { registerAdminTextHandler } from './adminTextHandler.js';

const bot = new Telegraf(config.TELEGRAM_BOT_TOKEN);
bot.use(session());

// Register separate logic
registerCommands(bot);
registerActions(bot);

registerAdminCommands(bot);
registerAdminTextHandler(bot);

registerTextHandler(bot);



bot.launch();
console.log('🚀 Book Quest Registration Bot launched successfully.');
