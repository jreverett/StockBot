const Discord = require('discord.js');
const yahooFinance = require('yahoo-finance');
const gis = require('g-i-s');

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
          const { price, summaryDetail, defaultKeyStatistics } = quote;
          const {
            currencySymbol,
            symbol,
            exchangeName,
            longName,
            marketState,
            regularMarketPrice,
            regularMarketPreviousClose,
            regularMarketChange,
            regularMarketChangePercent,
            regularMarketDayLow,
            regularMarketDayHigh,
          } = price;

          const isPositive = regularMarketPrice > regularMarketPreviousClose;
          const isMarketOpen = marketState === 'REGULAR' ? true : false;

          if (!price || !defaultKeyStatistics) {
            message.reply(
              `couldn't find enough data on that stock 😬 ($${userCommand.toUpperCase()})`
            );
            return;
          }

          const imageSearch = new Promise((resolve, reject) => {
            gis(`${longName} logo +.png -.svg`, (error, results) => {
              if (error) {
                reject(error);
              } else {
                resolve(results[0].url);
              }
            });
          });

          imageSearch.then((logoUrl) => {
            // TODO: turn this into a component
            // create and send an embed
            // prettier-ignore
            const stockEmbed = new Discord.MessageEmbed()
              .setColor('#0099ff')
              .setTitle(`${currencySymbol}${symbol} - ${exchangeName}`)
              .setURL(`https://finance.yahoo.com/quote/${userCommand}`)
              .setThumbnail(logoUrl)
              .setDescription(longName)
              .addFields(
                { name: 'Market Price', value: `${currencySymbol}${regularMarketPrice?.toLocaleString() ?? 'No Data'} | ${isPositive ? '▲' : '▼'} *${regularMarketChange.toFixed(2)} (${(regularMarketChangePercent * 100).toFixed(2)}%)*` },
                { name: 'Shares Float', value: defaultKeyStatistics.floatShares?.toLocaleString() ?? 'No Data', inline: true },
                { name: 'Shares Short', value: defaultKeyStatistics.sharesShort?.toLocaleString() ?? 'No Data', inline: true },
                { name: 'Volume', value: summaryDetail.volume?.toLocaleString() ?? 'No Data', inline: true },
                { name: 'Market Status', value: isMarketOpen ? 'OPEN' : 'CLOSED', inline: true },
                { name: 'Day Low', value: `${currencySymbol}${regularMarketDayLow}`, inline: true },
                { name: 'Day High', value: `${currencySymbol}${regularMarketDayHigh}`, inline: true },
              )
              .setFooter(`Use ${prefix}${Command.HELP} for a list of commands`)
              .setTimestamp();

            message.reply(stockEmbed);
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
