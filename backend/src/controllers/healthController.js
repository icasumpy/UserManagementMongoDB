const { getDatabaseStatus } = require('../config/database');

function getHealth(_request, response) {
  const database = getDatabaseStatus();
  const connected = database === 'connected';

  response.status(connected ? 200 : 503).json({
    status: connected ? 'ok' : 'unavailable',
    database,
  });
}

module.exports = { getHealth };
