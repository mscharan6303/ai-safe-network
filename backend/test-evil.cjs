const http = require('http');

const testDomains = [
  'www.evil-phishing-site.xyz',
  'free-bitcoin-doubler.xyz',
  'fake-bank-alert.com',
  'login-verify-urgent.com'
];

testDomains.forEach(domain => {
  const data = JSON.stringify({
    domain: domain,
    deviceHash: 'esp32'
  });

  const req = http.request({
    hostname: '192.168.1.2',
    port: 3000,
    path: '/api/dns-query',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  }, (res) => {
    let body = '';
    res.on('data', (chunk) => { body += chunk; });
    res.on('end', () => {
      console.log(`Domain: ${domain}`);
      console.log(`Response: ${body}`);
      console.log('---');
    });
  });

  req.on('error', (e) => console.error(`Error: ${e.message}`));
  req.write(data);
  req.end();
});
