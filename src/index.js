const Discord = require('discord.js');
const yahooFinance = require('yahoo-finance');

const auth = require('../auth.json');
const Commands = require('./commands');

const client = new Discord.Client();

const prefix = '$';

client.on('message', function (message) {
  if (message.author.bot || !message.content.startsWith(prefix)) return;

  const commandBody = message.content.slice(prefix.length);
  const args = commandBody.split(' ');
  const command = args.shift().toLowerCase();

  switch (command) {
    case Commands.PING:
      const timeTaken = Date.now() - message.createdTimestamp;
      message.reply(`pong! This message had a latency of ${timeTaken}ms.`);
      break;
    case Commands.SOURCE:
      message.reply('https://github.com/jreverett/StockBot');
      break;
    case Commands.HELP:
      const helpMessage = `\`\`\`prolog
            StockBot Commands
            '$!ping' - check bot latency
            '$!source' - link to the source code for this bot
            '$!help' - show list of commands
            ✨ more commands coming soon ✨\`\`\``;
      message.reply(helpMessage);
      break;
    default:
      // probably a stock symbol so try and get data for it
      yahooFinance
        .quote({
          symbol: command,
          modules: ['price', 'summaryDetail', 'defaultKeyStatistics'],
        })
        .then(function (quote) {
          const price = quote.price;
          const summaryDetail = quote.summaryDetail;
          const defaultKS = quote.defaultKeyStatistics;
          const isMarketOpen = price.marketState === 'OPEN' ? true : false;

          if (!price || !defaultKS) {
            message.reply(
              `couldn't find enough data on that stock 😬 (${command.toUpperCase()})`
            );
            return;
          }

          // create and send an embed
          // prettier-ignore
          const stockEmbed = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle(`${price.currencySymbol}${price.symbol} - ${price.exchangeName}`)
            .setURL(`https://finance.yahoo.com/quote/${command}`)
            .setDescription(price.longName)
            .addFields(
                { name: 'Market Price', value: `${price.currencySymbol}${price.regularMarketOpen.toLocaleString()}` },
                { name: 'Shares Float', value: defaultKS.floatShares.toLocaleString(), inline: true },
                { name: 'Shares Short', value: defaultKS.sharesShort.toLocaleString(), inline: true },
                { name: 'Volume', value: summaryDetail.volume.toLocaleString(), inline: true },
                { name: 'Market Status', value: isMarketOpen ? '```CSS\n  OPEN\n```' : '```prolog\n CLOSED\n```', inline: true },
                { name: '\u200B', value: '\u200B', inline: true },
                { name: '\u200B', value: '\u200B', inline: true },
            )
            .setFooter(`Use ${Commands.HELP} for a list of commands`)
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
                'something went wrong ;_; ```' + `${err.message}` + '```'
              );
            }
          }
        });
  }
});

client.login(auth.token);
