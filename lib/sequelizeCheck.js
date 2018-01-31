const Sequelize = require('sequelize');

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

    return new Sequelize(databaseName, value.params.username, value.params.password, {
      host: value.params.host,
      dialect: value.params.dialect,
      dialectOptions: {
        encrypt: encryptDb,
      },
    });
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
  }
};

module.exports = sequelizeCheck;
