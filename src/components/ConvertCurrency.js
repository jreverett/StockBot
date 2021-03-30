const fetch = require('node-fetch');
const fx = require('money');

function ConvertCurrency(valuesToConvert, fromCurrency, toCurrency) {
  return new Promise((resolve, reject) => {
    fetch('https://api.exchangeratesapi.io/latest') // default base rate is EUR
      .then((res) => res.text())
      .then((body) => {
        body = JSON.parse(body);

        fx.base = body.base;
        fx.rates = body.rates;
        body.rates['EUR'] = 1; // add the base rate

        if (!fx.rates.hasOwnProperty(toCurrency)) {
          reject(`currency '${toCurrency}' is unsupported`);
        }

        Object.keys(valuesToConvert).map((key) => {
          let convertedValue = fx(valuesToConvert[key])
            .from(fromCurrency)
            .to(toCurrency)
            .toFixed(2);

          valuesToConvert[key] = parseFloat(convertedValue);
        });

        resolve(valuesToConvert);
      })
      .catch(() => {
        reject("Couldn't get currency rates");
      });
  });
}

module.exports.ConvertCurrency = ConvertCurrency;
