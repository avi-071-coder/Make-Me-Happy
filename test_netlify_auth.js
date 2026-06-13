const handler = require('./netlify/functions/api').handler;

async function run() {
  const context = {};
  
  // 1. Signup
  let event = {
    httpMethod: 'POST',
    path: '/.netlify/functions/api/api/signup',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'testuser', password: 'password', confirmPassword: 'password' }),
    queryStringParameters: {}
  };
  
  let res = await handler(event, context);
  console.log("Signup:", res.statusCode, res.body);
  
  let token = JSON.parse(res.body).token;
  if (!token) {
     // try login
     event.path = '/.netlify/functions/api/api/login';
     event.body = JSON.stringify({ username: 'testuser', password: 'password' });
     res = await handler(event, context);
     console.log("Login:", res.statusCode, res.body);
     token = JSON.parse(res.body).token;
  }
  
  // 2. Get Daily Wins
  event = {
    httpMethod: 'GET',
    path: '/.netlify/functions/api/api/user/daily-wins',
    headers: { 'authorization': `Bearer ${token}` },
    queryStringParameters: {}
  };
  
  res = await handler(event, context);
  console.log("Daily Wins:", res.statusCode, res.body);
}

run();
