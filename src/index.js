const Discord = require('discord.js');
const yahooFinance = require('yahoo-finance');

const auth = require('../auth.json');
const Command = require('./command');
const { ConvertCurrency } = require('./components/ConvertCurrency');
const { CreateEmbed } = require('./components/CreateEmbed');

const client = new Discord.Client();

/////////////////////////////////////////////////////////////
// ON MESSAGE
client.on('message', (message) => {
  // return if bot is in a server and doesn't have send message permissions
  if (message.guild && !message.guild.me.hasPermission('SEND_MESSAGES')) return;

  // return if the sender of this message it a bot or the message isn't a command
  if (message.author.bot || !message.content.startsWith(Command.COMMAND_PREFIX))
    return;

  const commandBody = message.content.slice(Command.COMMAND_PREFIX.length);
  const args = commandBody.split(' ');
  const userCommand = args.shift().toLowerCase();

  let commandArgs = [];
  args.some((arg) => {
    if (!arg.startsWith(Command.ARGUMENT_PREFIX)) return true;
    arg = arg.slice(Command.ARGUMENT_PREFIX.length);
    commandArgs.push(arg);
  });

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
          let { price, defaultKeyStatistics } = quote;
          const {
            regularMarketPrice,
            regularMarketDayLow,
            regularMarketDayHigh,
            regularMarketPreviousClose,
            currency,
          } = price;

          if (!price || !defaultKeyStatistics) {
            message.reply(
              `couldn't find enough data on that stock 😬 ($${userCommand.toUpperCase()})`
            );
            return;
          }

          const targetCurrency = commandArgs[0]?.toUpperCase();

          // CURRENCY CONVERSIONS
          const valuesToConvert = {
            regularMarketPrice: regularMarketPrice,
            regularMarketDayLow: regularMarketDayLow,
            regularMarketDayHigh: regularMarketDayHigh,
            regularMarketPreviousClose: regularMarketPreviousClose,
          };

          if (targetCurrency) {
            ConvertCurrency(valuesToConvert, currency, targetCurrency)
              .then((convertedValues) => {
                quote.price = {
                  ...price,
                  ...convertedValues,
                  targetCurrency: targetCurrency,
                };

                CreateEmbed(userCommand, quote).then((embed) => {
                  message.reply(embed);
                });
              })
              .catch((err) => {
                message.reply(`${err}`);
              });
          } else {
            // TODO: refactor repeated code
            CreateEmbed(userCommand, quote).then((embed) => {
              message.reply(embed);
            });
          }
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
