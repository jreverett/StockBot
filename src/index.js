const Discord = require('discord.js');
const yahooFinance = require('yahoo-finance');

const auth = require('../auth.json');
const Command = require('./command');
const { CreateEmbed } = require('./components/CreateEmbed');

const client = new Discord.Client();

/////////////////////////////////////////////////////////////
// ON MESSAGE
client.on('message', (message) => {
  if (!message.guild.me.hasPermission('SEND_MESSAGES')) return;
  
  if (message.author.bot || !message.content.startsWith(Command.PREFIX)) return;

  const commandBody = message.content.slice(Command.PREFIX.length);
  const args = commandBody.split(' ');
  const userCommand = args.shift().toLowerCase();

  switch (userCommand) {
    case Command.PING:
      const timeTaken = Date.now() - message.createdTimestamp;
      message.reply(`pong! This message had a latency of ${timeTaken}ms.`);
      break;
    case Command.SOURCE:
      message.reply('https://github.com/jreverett/StockBot');
      break;
    case Command.HELP:
      const helpMessage = `\`\`\`prolog
            StockBot Commands
            '$!ping' - check bot latency
            '$!source' - link to the source code for this bot
            '$!help' - show list of commands
            ✨ more commands coming soon ✨\`\`\``;
      message.reply(helpMessage);
      break;
    case Command.SHUTDOWN:
      // in case of emergency
      if (message.author.id === auth.adminId) {
        message.reply(`ok, shutting down 😴`).then(() => {
          process.exit(0);
        });
      } else {
        message.reply(`you don't have permission to do that, you cheeky scrub`);
      }
      break;
    default:
      if (!userCommand) return;

      // probably a stock symbol so try and get data for it
      yahooFinance
        .quote({
          symbol: userCommand,
          modules: ['price', 'summaryDetail', 'defaultKeyStatistics'],
        })
        .then((quote) => {
          const { price, defaultKeyStatistics } = quote;

          if (!price || !defaultKeyStatistics) {
            message.reply(
              `couldn't find enough data on that stock 😬 ($${userCommand.toUpperCase()})`
            );
            return;
          }

          CreateEmbed(userCommand, quote).then((embed) => {
            message.reply(embed);
          });
        })
        .catch((err) => {
          if (err) {
            // error object doesn't have an error code property, so this is a workaround
            if (err.message.includes('Not Found')) {
              message.reply(
                `I couldn't find a stock with that symbol 😰 ($${userCommand.toUpperCase()})`
              );
            } else {
              message.reply(
                `something went wrong ;_; \`\`\`${err.message}\`\`\``
              );
            }
          }
        });
  }
});

client.login(auth.token);
