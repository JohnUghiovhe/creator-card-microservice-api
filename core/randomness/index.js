function generateUlid() {
    // Simple timestamp + random character ULID mockup string generator
    const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
    let timestampPart = Date.now().toString(32).toUpperCase();
    let randomPart = '';
    for (let i = 0; i < 16; i++) {
      randomPart += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return (timestampPart + randomPart).substring(0, 26);
  }
  
  module.exports = {
    ulid: generateUlid
  };
  