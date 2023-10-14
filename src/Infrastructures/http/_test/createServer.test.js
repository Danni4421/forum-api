const Jwt = require('@hapi/jwt');
const createServer = require('../createServer');
const JwtTokenManager = require('../../security/JwtTokenManager');

describe('HTTP server', () => {
  it('should response 404 when request unregistered route', async () => {
    // Arrange
    const server = await createServer({});

    // Action
    const response = await server.inject({
      method: 'GET',
      url: '/unregisteredRoute',
    });

    // Assert
    expect(response.statusCode).toEqual(404);
  });

  it('should handle server error correctly', async () => {
    // Arrange
    const requestPayload = {
      username: 'dicoding',
      fullname: 'Dicoding Indonesia',
      password: 'super_secret',
    };
    const server = await createServer({}); // fake injection

    // Action
    const response = await server.inject({
      method: 'POST',
      url: '/users',
      payload: requestPayload,
    });

    // Assert
    const responseJson = JSON.parse(response.payload);
    expect(response.statusCode).toEqual(500);
    expect(responseJson.status).toEqual('error');
    expect(responseJson.message).toEqual('terjadi kegagalan pada server kami');
  });

  describe('server auth strategy', () => {
    it('should return 200 when given token', async () => {
      // Arrange
      const server = await createServer({});
      server.route({
        method: 'GET',
        path: '/thread',
        handler: () => 'This is thread',
        options: {
          auth: 'forumapi_jwt',
        },
      });
      const jwtTokenManager = new JwtTokenManager(Jwt.token);
      const accessToken = await jwtTokenManager.createAccessToken('user-123');

      // Action
      const response = await server.inject({
        method: 'GET',
        url: '/thread',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Assert
      expect(response.statusCode).toEqual(200);
      expect(response.payload).toEqual('This is thread');
    });

    it('should return 401 when not given token', async () => {
      // Arrange
      const server = await createServer({});
      server.route({
        method: 'GET',
        path: '/thread',
        handler: () => 'This is thread',
        options: {
          auth: 'forumapi_jwt',
        },
      });

      // Action
      const response = await server.inject({
        method: 'GET',
        url: '/thread',
      });

      // Assert
      expect(response.statusCode).toEqual(401);
    });
  });
});
