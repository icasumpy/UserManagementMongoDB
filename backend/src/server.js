const app = require('./app');
const { port } = require('./config/env');
const { connectToDatabase } = require('./config/database');
const { getAdminAuthConfigIssues } = require('./services/adminAuthService');

app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
  const authConfigIssues = getAdminAuthConfigIssues();
  if (authConfigIssues.length > 0) {
    console.error(`[auth] Admin authentication is disabled until backend/.env is configured: ${authConfigIssues.join(', ')}.`);
  }
  void connectToDatabase();
});
