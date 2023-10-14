const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const RegisterUser = require('../../../Domains/users/entities/RegisterUser');
const container = require('../../container');
const createServer = require('../createServer');
const pool = require('../../database/postgres/pool');

describe('/threads endpoint', () => {
  beforeAll(async () => {
    // Arrange
    const registerUser = new RegisterUser({
      username: 'ajhmdni',
      password: 'super_secret',
      fullname: 'Aji Hamdani Ahmad',
    });
    const server = await createServer(container);

    // Action
    await server.inject({
      method: 'POST',
      url: '/users',
      payload: registerUser,
    });
  });

  afterEach(async () => {
    await ThreadsTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await UsersTableTestHelper.cleanTable();
    await pool.end();
  });

  describe('when POST /threads', () => {
    it('should response 201 and new thread', async () => {
      // Arrange
      const threadPayload = {
        title: 'sebuah thread',
        body: 'content dari thread',
      };
      const server = await createServer(container);
      const { accessToken } = await server
        .inject({
          method: 'POST',
          url: '/authentications',
          payload: {
            username: 'ajhmdni',
            password: 'super_secret',
          },
        })
        .then((response) => {
          const responseJson = JSON.parse(response.payload);
          return responseJson.data;
        });

      // Action
      const response = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: threadPayload,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(201);
      expect(responseJson.status).toEqual('success');
      expect(responseJson.data.addedThread).toBeDefined();
      expect(responseJson.data.addedThread.id).toBeDefined();
      expect(responseJson.data.addedThread.title).toBeDefined();
      expect(responseJson.data.addedThread.owner).toBeDefined();
    });

    it('should response 401 when missing authentication token', async () => {
      // Arrange
      const threadPayload = {
        title: 'sebuah thread',
        body: 'content sebuah thread',
      };
      const server = await createServer(container);

      // Action
      const response = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: threadPayload,
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(401);
      expect(responseJson.error).toEqual('Unauthorized');
    });

    describe('given bad request', () => {
      it('should response 400 when not given needed payload', async () => {
        // Arrange
        const threadPayload = {
          title: 'sebuah thread',
        };
        const server = await createServer(container);
        const { accessToken } = await server
          .inject({
            method: 'POST',
            url: '/authentications',
            payload: {
              username: 'ajhmdni',
              password: 'super_secret',
            },
          })
          .then((response) => {
            const responseJson = JSON.parse(response.payload);
            return responseJson.data;
          });

        // Action
        const response = await server.inject({
          method: 'POST',
          url: '/threads',
          payload: threadPayload,
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const responseJson = JSON.parse(response.payload);
        expect(response.statusCode).toEqual(400);
        expect(responseJson.status).toEqual('fail');
      });

      it('should response 400 when given not meet data type payload', async () => {
        // Arrange
        const threadPayload = {
          title: 'sebuah thread',
          body: true,
        };
        const server = await createServer(container);
        const { accessToken } = await server
          .inject({
            method: 'POST',
            url: '/authentications',
            payload: {
              username: 'ajhmdni',
              password: 'super_secret',
            },
          })
          .then((response) => {
            const responseJson = JSON.parse(response.payload);
            return responseJson.data;
          });

        // Action
        const response = await server.inject({
          method: 'POST',
          url: '/threads',
          payload: threadPayload,
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const responseJson = JSON.parse(response.payload);
        expect(response.statusCode).toEqual(400);
        expect(responseJson.status).toEqual('fail');
      });
    });
  });

  describe('when GET /threads', () => {
    let threadId;

    beforeEach(async () => {
      // Arrange post thread
      const threadPayload = {
        title: 'new thread',
        body: 'isi dari thread',
      };
      const server = await createServer(container);

      const { accessToken } = await server
        .inject({
          method: 'POST',
          url: '/authentications',
          payload: {
            username: 'ajhmdni',
            password: 'super_secret',
          },
        })
        .then((response) => {
          const responseJson = JSON.parse(response.payload);
          return responseJson.data;
        });

      // Action post thread
      await server
        .inject({
          method: 'POST',
          url: '/threads',
          payload: threadPayload,
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        .then((response) => {
          const responseJson = JSON.parse(response.payload);
          threadId = responseJson.data.addedThread.id;
        });
    });

    it('should response 404 when given wrong thread id', async () => {
      // Arrange
      const server = await createServer(container);

      // Action
      const response = await server.inject({
        method: 'GET',
        url: '/threads/xxxx',
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(404);
      expect(responseJson.status).toEqual('fail');
    });

    it('should response 200 when given valid thread id', async () => {
      // Arrange
      const server = await createServer(container);

      // Action
      const response = await server.inject({
        method: 'GET',
        url: `/threads/${threadId}`,
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      const {
        data: { thread },
      } = responseJson;
      expect(response.statusCode).toEqual(200);
      expect(responseJson.status).toEqual('success');
      expect(thread.id).toBeDefined();
      expect(thread.title).toBeDefined();
      expect(thread.body).toBeDefined();
      expect(thread.date).toBeDefined();
      expect(thread.username).toBeDefined();
      expect(thread.comments).toBeDefined();
    });
  });
});
