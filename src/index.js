const Discord = require('discord.js');
const yahooFinance = require('yahoo-finance');

const auth = require('../auth.json');
const Command = require('./command');

const client = new Discord.Client();

const prefix = '$';

/////////////////////////////////////////////////////////////
// ON MESSAGE
client.on('message', (message) => {
  if (message.author.bot || !message.content.startsWith(prefix)) return;

  const commandBody = message.content.slice(prefix.length);
  const args = commandBody.split(' ');
  const userCommand = args.shift().toLowerCase();

  switch (userCommand) {
    case Command.PING:
      const timeTaken = message.createdTimestamp - Date.now();
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
      const { username, discriminator } = message.author;

      if (`${username}#${discriminator}` === auth.admin) {
        message.reply(`ok, shutting down 😴`);
        process.exitCode = 0;
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
          const { price, summaryDetail, defaultKeyStatistics } = quote;
          const isMarketOpen = price.marketState === 'REGULAR' ? true : false;

          if (!price || !defaultKeyStatistics) {
            message.reply(
              `couldn't find enough data on that stock 😬 (${userCommand.toUpperCase()})`
            );
            return;
          }

          // create and send an embed
          // prettier-ignore
          const stockEmbed = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle(`${price.currencySymbol}${price.symbol} - ${price.exchangeName}`)
            .setURL(`https://finance.yahoo.com/quote/${userCommand}`)
            .setDescription(price.longName)
            .addFields(
                { name: 'Market Price', value: `${price.currencySymbol}${price.regularMarketPrice.toLocaleString()}` },
                { name: 'Shares Float', value: defaultKeyStatistics.floatShares.toLocaleString(), inline: true },
                { name: 'Shares Short', value: defaultKeyStatistics.sharesShort.toLocaleString(), inline: true },
                { name: 'Volume', value: summaryDetail.volume.toLocaleString(), inline: true },
                { name: 'Market Status', value: isMarketOpen ? '```bash\n "OPEN"\n```' : '```prolog\n CLOSED\n```', inline: true },
                { name: '\u200B', value: '\u200B', inline: true },
                { name: '\u200B', value: '\u200B', inline: true },
            )
            .setFooter(`Use ${prefix}${Command.HELP} for a list of commands`)
            .setTimestamp();

          message.reply(stockEmbed);
        })
        .catch((err) => {
          if (err) {
            // error object doesn't have an error code property, so this is a workaround
            if (err.message.includes('Not Found')) {
              message.reply("I couldn't find a stock with that symbol 😰");
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
