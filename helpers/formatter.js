const phoneNumberFormatter = function(number) {
  // 1. Menghilangkan karakter selain angka
  let formatted = number.replace(/\D/g, '');

  // 2. Menghilangkan angka 0 di depan (prefix)
  //    Kemudian diganti dengan 62
  if (formatted.startsWith('0')) {
    formatted = '62' + formatted.substr(1);
  }

  if (!formatted.endsWith('@c.us')) {
    formatted += '@c.us';
  }

  return formatted;
}


const phoneReturnFormatter = function(number) {
  // 1. Menghilangkan karakter selain angka
  let formatted = number.replace(/\D/g, '');

  // 2. Menghilangkan angka 62 di depan, kemudian diganti dengan angka 0
  if (formatted.startsWith('62')) {
    formatted = '0' + formatted.substr(2);
  }


  if (formatted.endsWith('@c.us')) {
    formatted += '@c.us';
  }

  return formatted;
}

module.exports = {
  phoneNumberFormatter,
  phoneReturnFormatter
}