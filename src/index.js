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
    default:
      // probably a stock symbol so try and get data for it
      yahooFinance
        .quote({
          symbol: command,
          modules: ['price', 'defaultKeyStatistics'],
        })
        .then(function (quote) {
          const price = quote.price;
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
            .setDescription(price.longName)
            .addFields(
                { name: 'Market Price', value: `${price.currencySymbol}${price.regularMarketOpen}` },
                { name: 'Shares Float', value: defaultKS.floatShares, inline: true },
                { name: 'Shares Short', value: defaultKS.sharesShort, inline: true },
                { name: 'Market Status', value: isMarketOpen ? '```CSS\n  OPEN\n```' : '```prolog\n CLOSED\n```', inline: true }
            )
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
