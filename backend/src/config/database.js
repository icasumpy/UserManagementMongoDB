const mongoose = require('mongoose');
const { mongoUri, mongoDbName } = require('./env');

let databaseReady = false;
let collectionInitialization;

function getDatabaseStatus() {
  if (mongoose.connection.readyState === 1 && databaseReady) return 'connected';
  if (mongoose.connection.readyState === 2) return 'connecting';
  if (mongoose.connection.readyState === 3) return 'disconnecting';
  if (mongoose.connection.readyState === 1) return 'initializing';
  return 'disconnected';
}

function logConnectionError(error, context) {
  const errorName = typeof error?.name === 'string' ? error.name : 'Error';
  const errorCode = typeof error?.code === 'number' ? `, code ${error.code}` : '';
  console.error(`[mongodb] ${context} (${errorName}${errorCode}). Check Atlas network access, credentials, and database permissions. URI and credentials are omitted.`);
}

async function ensureUsersCollection() {
  if (collectionInitialization) return collectionInitialization;

  collectionInitialization = (async () => {
    const database = mongoose.connection.db;
    if (!database) throw new Error('MongoDB database handle is unavailable');

    const usersCollectionExists = await database
      .listCollections({ name: 'users' }, { nameOnly: true })
      .hasNext();

    if (!usersCollectionExists) {
      try {
        await database.createCollection('users');
      } catch (error) {
        // Another backend instance may have created the collection at the same time.
        if (error?.code !== 48 && error?.codeName !== 'NamespaceExists') throw error;
      }
    }

    // Enforce uniqueness atomically, including concurrent create requests.
    await database.collection('users').createIndex(
      { email: 1 },
      { unique: true, name: 'unique_user_email' },
    );

    databaseReady = true;
  })();

  try {
    await collectionInitialization;
  } finally {
    collectionInitialization = undefined;
  }
}

async function connectToDatabase() {
  databaseReady = false;

  if (!mongoUri) {
    console.error('[mongodb] MONGODB_URI is not configured. Database features remain unavailable.');
    return false;
  }
  if (mongoDbName !== 'UserManagementDB') {
    console.error('[mongodb] MONGODB_DB_NAME must be set to UserManagementDB. Database features remain unavailable.');
    return false;
  }

  try {
    await mongoose.connect(mongoUri, {
      dbName: mongoDbName,
      serverSelectionTimeoutMS: 10000,
      autoIndex: false,
      autoCreate: false,
    });
    await ensureUsersCollection();
    console.log('[mongodb] Connected to UserManagementDB; users collection is available.');
    return true;
  } catch (error) {
    databaseReady = false;
    logConnectionError(error, 'Connection or collection initialization failed');
    return false;
  }
}

mongoose.connection.on('disconnected', () => {
  databaseReady = false;
  console.error('[mongodb] Connection lost; database features are unavailable.');
});

mongoose.connection.on('reconnected', () => {
  databaseReady = false;
  ensureUsersCollection()
    .then(() => console.log('[mongodb] Connection restored; users collection is available.'))
    .catch((error) => {
      databaseReady = false;
      logConnectionError(error, 'Collection initialization after reconnect failed');
    });
});

mongoose.connection.on('error', (error) => {
  logConnectionError(error, 'MongoDB connection error');
});

module.exports = { connectToDatabase, getDatabaseStatus };
