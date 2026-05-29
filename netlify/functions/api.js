const serverless = require('serverless-http');
const app = require('../../server'); // Imports the Express app
module.exports.handler = serverless(app);
