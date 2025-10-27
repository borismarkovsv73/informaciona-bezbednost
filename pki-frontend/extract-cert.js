const fs = require('fs');
const crypto = require('crypto');

// Read the PKCS12 file
const p12Buffer = fs.readFileSync('./certs/localhost.p12');
const passphrase = 'keystorePassword123';

try {
  // Parse PKCS12
  const p12 = crypto.createSecureContext({
    pfx: p12Buffer,
    passphrase: passphrase
  });
  
  console.log('PKCS12 parsed successfully');
  console.log('Certificate and key are available in the secure context');
  
  // For Next.js HTTPS, we can use the PKCS12 directly
  // Let's copy it to a better location
  fs.copyFileSync('./certs/localhost.p12', './certs/localhost.pfx');
  
  console.log('Certificate copied to localhost.pfx for Next.js use');
} catch (error) {
  console.error('Error parsing PKCS12:', error);
}