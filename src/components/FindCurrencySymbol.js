function FindCurrencySymbol(identifier) {
  var currencySymbols = {
    USD: '$', // US Dollar
    CAD: '$', // Canadian Dollar
    AUD: '$', // Australian Dollar
    EUR: '€', // Euro
    CRC: '₡', // Costa Rican Colón
    GBP: '£', // British Pound Sterling
    ILS: '₪', // Israeli New Sheqel
    INR: '₹', // Indian Rupee
    JPY: '¥', // Japanese Yen
    KRW: '₩', // South Korean Won
    NGN: '₦', // Nigerian Naira
    PHP: '₱', // Philippine Peso
    PLN: 'zł', // Polish Zloty
    PYG: '₲', // Paraguayan Guarani
    THB: '฿', // Thai Baht
    UAH: '₴', // Ukrainian Hryvnia
    VND: '₫', // Vietnamese Dong
  };

  return currencySymbols[identifier] === undefined
    ? '¤'
    : currencySymbols[identifier];
}

module.exports.FindCurrencySymbol = FindCurrencySymbol;
