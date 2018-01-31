const express = require('express');
const healthcheck = require('./../lib');

const app = express();

app.use('/healthcheck', healthcheck({
  config: {
    good: {
      connectionString: 'redis://localhost:6379',
    },
    bad: {
      connectionString: 'redis://nosuchhost:1234',
    },
  },
}));

app.listen(3000, () => {
  console.info('Healthcheck mounted at http://localhost:3000/healthcheck');
});
