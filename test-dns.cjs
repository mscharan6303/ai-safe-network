const http = require('http');

const data = JSON.stringify({
  domain: "test-phishing-site.com",
  deviceHash: "esp32test123"
});

const options = {
  hostname: '192.168.1.2',
  port: 3000,
  path: '/api/dns-query',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log('Status:', res.statusCode);
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  res.on('end', () => {
    console.log('Response:', body);
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
});

req.write(data);
req.end();
