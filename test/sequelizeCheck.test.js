jest.mock('sequelize');

const Sequelize = require('sequelize');
const sequelizeCheck = require('./../lib/sequelizeCheck');

describe('When running redis check', () => {
  let authenticate;

  beforeEach(() => {
    authenticate = jest.fn();

    Sequelize.mockReset();
    Sequelize.mockImplementation(() => {
      return {
        authenticate,
      };
    });
  });

  it('then it should check if key is postgresurl', async () => {
    await sequelizeCheck('postgresurl', 'postgres://localhost', 'path.to.key');

    expect(Sequelize.mock.calls).toHaveLength(1);
    expect(Sequelize.mock.calls[0][0]).toBe('postgres://localhost');
    expect(authenticate.mock.calls).toHaveLength(1);
  });

  it('then it should check if key is connectionstring and value starts with postgres://', async () => {
    await sequelizeCheck('connectionstring', 'postgres://localhost', 'path.to.key');

    expect(Sequelize.mock.calls).toHaveLength(1);
    expect(Sequelize.mock.calls[0][0]).toBe('postgres://localhost');
    expect(authenticate.mock.calls).toHaveLength(1);
  });

  it('then it should not check if key is connectionstring but value does not starts with postgres://', async () => {
    await sequelizeCheck('connectionstring', 'redis://localhost', 'path.to.key');

    expect(Sequelize.mock.calls).toHaveLength(0);
    expect(authenticate.mock.calls).toHaveLength(0);
  });

  it('then it should check if value has type of sequelize and params', async () => {
    const value = {
      type: 'sequelize',
      params: {
        name: 'testdbname',
        username: 'test',
        password: 'password123',
        host: 'localhost',
        dialect: 'mssql',
        encrypt: true,
      },
    };
    await sequelizeCheck('somekey', value, 'path.to.key');

    expect(Sequelize.mock.calls).toHaveLength(1);
    expect(Sequelize.mock.calls[0][0]).toBe('testdbname');
    expect(Sequelize.mock.calls[0][1]).toBe('test');
    expect(Sequelize.mock.calls[0][2]).toBe('password123');
    expect(Sequelize.mock.calls[0][3]).toMatchObject({
      host: 'localhost',
      dialect: 'mssql',
      dialectOptions: {
        encrypt: true,
      },
    });
    expect(authenticate.mock.calls).toHaveLength(1);
  });

  it('then it should return status of ok if connection does not error', async () => {
    const actual = await sequelizeCheck('postgresurl', 'postgres://localhost', 'path.to.key');

    expect(actual).toMatchObject({
      key: 'postgresurl',
      path: 'path.to.key',
      status: 'ok',
    });
  });

  it('then it should return status of error messafe if connection does error', async () => {
    authenticate.mockImplementation(() => {
      throw new Error('some error message');
    });

    const actual = await sequelizeCheck('postgresurl', 'postgres://localhost', 'path.to.key');

    expect(actual).toMatchObject({
      key: 'postgresurl',
      path: 'path.to.key',
      status: 'some error message',
    });
  });
});
