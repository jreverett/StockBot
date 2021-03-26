const Discord = require('discord.js');
const gis = require('g-i-s');

const Command = require('../command');

function CreateEmbed(userCommand, quote) {
  return new Promise((resolve, reject) => {
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
            { name: 'Market Price', value: `${currencySymbol}${regularMarketPrice?.toLocaleString() ?? 'No Data'} | ${isPositive ? '▲' : '▼'} *${regularMarketChange.toFixed(2)} (${(regularMarketChangePercent * 100).toFixed(2)}%)*` },
            { name: 'Shares Float', value: defaultKeyStatistics.floatShares?.toLocaleString() ?? 'No Data', inline: true },
            { name: 'Shares Short', value: defaultKeyStatistics.sharesShort?.toLocaleString() ?? 'No Data', inline: true },
            { name: 'Volume', value: summaryDetail.volume?.toLocaleString() ?? 'No Data', inline: true },
            { name: 'Market Status', value: isMarketOpen ? 'OPEN' : 'CLOSED', inline: true },
            { name: 'Day Low', value: `${currencySymbol}${regularMarketDayLow}`, inline: true },
            { name: 'Day High', value: `${currencySymbol}${regularMarketDayHigh}`, inline: true },
        )
        .setFooter(`Use ${Command.PREFIX}${Command.HELP} for a list of commands`)
        .setTimestamp();

      resolve(embed);
    });
  });
}

module.exports.CreateEmbed = CreateEmbed;
