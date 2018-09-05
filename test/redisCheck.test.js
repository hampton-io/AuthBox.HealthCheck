jest.mock('ioredis');

const Redis = require('ioredis');
const redisCheck = require('./../lib/redisCheck');
const EventEmitter = require('events');

class RedisStub extends EventEmitter {
  disconnect() {

  }
}

describe('When running redis check', () => {
  let stub;
  beforeEach(() => {
    stub = new RedisStub();
    Redis.mockReset();
    Redis.mockImplementation(() => {
      return stub;
    });
  });

  it('then it should check if key is redisurl', async () => {
    const checkPromise = redisCheck('redisUrl', 'redis://unit.test:6379', 'path.to.key', null);
    stub.emit('ready');
    await checkPromise;

    expect(Redis.mock.calls).toHaveLength(1);
    expect(Redis.mock.calls[0][0]).toBe('redis://unit.test:6379');
  });

  it('then it should check if key is connectionstring and value starts with redis://', async () => {
    const checkPromise = redisCheck('connectionString', 'redis://unit.test:6379', 'path.to.key', null);
    stub.emit('ready');
    await checkPromise;

    expect(Redis.mock.calls).toHaveLength(1);
    expect(Redis.mock.calls[0][0]).toBe('redis://unit.test:6379');
  });

  it('then it should not check if key is connectionstring but value does not starts with redis://', async () => {
    const checkPromise = redisCheck('connectionString', 'sql://unit.test:6379', 'path.to.key', null);
    stub.emit('ready');
    await checkPromise;

    expect(Redis.mock.calls).toHaveLength(0);
  });

  it('then it should check if value has a type of redis and has a param that starts redis://', async () => {
    const checkPromise = redisCheck('someKey', {
      type: 'redis',
      params: { 'constr': 'redis://unit.test:6379' }
    }, 'path.to.key', null);
    stub.emit('ready');
    await checkPromise;

    expect(Redis.mock.calls).toHaveLength(1);
    expect(Redis.mock.calls[0][0]).toBe('redis://unit.test:6379');
  });

  it('then it should not check if key is not redis oriented', async () => {
    const checkPromise = redisCheck('level', 'some-value', 'path.to.key', null);
    stub.emit('ready');
    await checkPromise;

    expect(Redis.mock.calls).toHaveLength(0);
  });

  it('then it should return ok if redis connects', async () => {
    const checkPromise = redisCheck('connectionString', 'redis://unit.test:6379', 'path.to.key', null);
    stub.emit('ready');
    const actual = await checkPromise;

    expect(actual).toMatchObject({
      key: 'connectionString',
      path: 'path.to.key',
      status: 'ok',
    });
  });

  it('then it should return error code if redis fails to connect', async () => {
    const checkPromise = redisCheck('connectionString', 'redis://unit.test:6379', 'path.to.key', null);
    stub.emit('error', { code: 'TESTERROR' });
    const actual = await checkPromise;

    expect(actual).toMatchObject({
      key: 'connectionString',
      path: 'path.to.key',
      status: 'TESTERROR',
    });
  });
});