const Sequelize = require('sequelize');

const Op = Sequelize.Op;

const getConnection = (key, value) => {
  if (key.toLowerCase() === 'postgresurl') {
    return new Sequelize(value);
  }
  if (key.toLowerCase() === 'connectionstring' && value.toString().toLowerCase().startsWith('postgres://')) {
    return new Sequelize(value);
  }
  if (value instanceof Object && value.type === 'sequelize' && value.params) {
    const databaseName = value.params.name || 'postgres';
    const encryptDb = value.params.encrypt || false;

    const dbOpts = {
      retry: {
        match: [
          /SequelizeConnectionError/,
          /SequelizeConnectionRefusedError/,
          /SequelizeHostNotFoundError/,
          /SequelizeHostNotReachableError/,
          /SequelizeInvalidConnectionError/,
          /SequelizeConnectionTimedOutError/,
          /TimeoutError/,
        ],
        name: 'query',
        backoffBase: 100,
        backoffExponent: 1.1,
        timeout: 60000,
        max: 5,
      },
      host: value.params.host,
      dialect: value.params.dialect,
      dialectOptions: {
        encrypt: encryptDb,
      },
    };

    if (value.params.pool) {
      dbOpts.pool = value.params.pool;
    }

    return new Sequelize(databaseName, value.params.username, value.params.password, dbOpts);
  }
  return null;
};

const sequelizeCheck = async (key, value, path) => {
  const connection = getConnection(key, value);
  if (!connection) {
    return null;
  }

  try {
    await connection.authenticate();

    return {
      key,
      path,
      status: 'ok',
    };
  } catch (e) {
    return {
      key,
      path,
      status: e.message,
    };
  } finally {
    if (connection) {
      await connection.close();
    }
  }
};

module.exports = sequelizeCheck;
