const Redis = require('ioredis');
const URL = require('url');

const getConnectionString = (key, value) => {
  if (key.toLowerCase() === 'redisurl') {
    return value;
  }
  if (key.toLowerCase() === 'connectionstring' && value.toString().startsWith('redis://')) {
    return value;
  }
  if (key.toLowerCase() === 'redis' && value instanceof Object && value.host && value.port) {
    const auth = value.auth ? `h:${value.auth}@` : '';
    return `redis://${auth}${value.host}:${value.port}`;
  }
  if (value instanceof Object && value.type === 'redis' && value.params) {
    const paramValues = Object.keys(value.params)
      .filter((key) => key.toLowerCase() !== 'connectionstring')
      .map((key) => value.params[key]);
    const connectionString = paramValues.find((value) => value.toLowerCase().startsWith('redis://'));
    if (connectionString) {
      return connectionString;
    }
  }
  return null;
};

const getConnectionStatus = async (connectionString) => {
  return new Promise((resolve) => {
    try {
      const url = URL.parse(connectionString, true);
      if (!url.query.tls) {
        if (connectionString.includes('6380')) {
          url.query.tls = true;
          connectionString = url.format(url);
        }
      }

      const client = new Redis(connectionString);
      client.on('ready', () => {
        try {
          client.disconnect()
        } catch (e) {
          // log here if we start seeing leaks
        }
        resolve('ok');
      });
      client.on('error', (e) => {
        try {
          client.disconnect()
        } catch (e) {
          // swallow this as we expect disconnects to fail if connect also failed.
        }

        resolve(e.code);
      })
    } catch (e) {
      resolve(e.message);
    }
  });
};

const redisCheck = async (key, value, path, parent) => {
  const connectionString = getConnectionString(key, value);
  if (!connectionString) {
    return null;
  }

  const status = await getConnectionStatus(connectionString);
  return {
    key,
    path,
    status,
  };
};

redisCheck.getConnectionStatus = getConnectionStatus;

module.exports = redisCheck;
