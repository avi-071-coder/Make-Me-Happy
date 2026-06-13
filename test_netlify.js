const handler = require('./netlify/functions/api').handler;

async function run() {
  const event = {
    httpMethod: 'GET',
    path: '/.netlify/functions/api/api/random-reason',
    headers: {},
    queryStringParameters: {}
  };
  
  const context = {};
  
  try {
    const res = await handler(event, context);
    console.log(res.statusCode);
    console.log(res.body);
  } catch (err) {
    console.error(err);
  }
}

run();
