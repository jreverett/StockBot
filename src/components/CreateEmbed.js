const Discord = require('discord.js');
const gis = require('g-i-s');

const Command = require('../command');
const { FindCurrencySymbol } = require('./FindCurrencySymbol');

function CreateEmbed(userCommand, quote) {
  return new Promise((resolve, reject) => {
    const { price, summaryDetail, defaultKeyStatistics } = quote;
    const {
      targetCurrency,
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

    let { currencySymbol } = price;
    if (targetCurrency) currencySymbol = FindCurrencySymbol(targetCurrency);

    const isPositive = regularMarketPrice > regularMarketPreviousClose;
    const isMarketOpen = marketState === 'REGULAR' ? true : false;

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
      // prettier-ignore
      const embed = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle(`${currencySymbol}${symbol} - ${exchangeName}`)
        .setURL(`https://finance.yahoo.com/quote/${userCommand}`)
        .setThumbnail(logoUrl)
        .setDescription(longName)
        .addFields(
            { name: 'Market Price', value: `${currencySymbol}${regularMarketPrice?.toFixed(2) ?? 'No Data'} | ${isPositive ? '▲' : '▼'} *${regularMarketChange.toFixed(2)} (${(regularMarketChangePercent * 100).toFixed(2)}%)*` },
            { name: 'Shares Float', value: defaultKeyStatistics.floatShares?.toLocaleString() ?? 'No Data', inline: true },
            { name: 'Shares Short', value: defaultKeyStatistics.sharesShort?.toLocaleString() ?? 'No Data', inline: true },
            { name: 'Volume', value: summaryDetail.volume?.toLocaleString() ?? 'No Data', inline: true },
            { name: 'Market Status', value: isMarketOpen ? 'OPEN' : 'CLOSED', inline: true },
            { name: 'Day Low', value: `${currencySymbol}${regularMarketDayLow.toFixed(2)}`, inline: true },
            { name: 'Day High', value: `${currencySymbol}${regularMarketDayHigh.toFixed(2)}`, inline: true },
        )
        .setFooter(`Use ${Command.COMMAND_PREFIX}${Command.HELP} for a list of commands`)
        .setTimestamp();

      resolve(embed);
    });
  });
}

module.exports.CreateEmbed = CreateEmbed;
