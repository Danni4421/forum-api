const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const createServer = require('../createServer');
const container = require('../../container');
const pool = require('../../database/postgres/pool');

describe('/comments endpoint', () => {
  let threadId;

  beforeAll(async () => {
    // Arrange
    const postUserPayload = {
      username: 'ajhmdni',
      password: 'super_secret',
      fullname: 'Aji Hamdani Ahmad',
    };
    const server = await createServer(container);

    // Action
    await server.inject({
      method: 'POST',
      url: '/users',
      payload: postUserPayload,
    });

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

    const {
      addedThread: { id },
    } = await server
      .inject({
        method: 'POST',
        url: '/threads',
        payload: {
          title: 'new thread',
          body: 'thread content',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      .then((response) => {
        const responseJson = JSON.parse(response.payload);
        return responseJson.data;
      });

    threadId = id;
  });

  afterAll(async () => {
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
    await pool.end();
  });

  afterEach(async () => {
    await CommentsTableTestHelper.cleanTable();
  });

  it('should response 404 not found error when thread id is not exists', async () => {
    // Arrange
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
      url: '/threads/invalid-thread/comments',
      payload: {
        content: 'this is comment to a thread',
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // Assert
    const responseJson = JSON.parse(response.payload);
    expect(response.statusCode).toEqual(404);
    expect(responseJson.status).toEqual('fail');
  });

  it('should response 201 when given valid thread id and return addedd comment', async () => {
    // Arrange
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
      url: `/threads/${threadId}/comments`,
      payload: {
        content: 'your thread is excellent',
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // Assert
    const responseJson = JSON.parse(response.payload);
    expect(response.statusCode).toEqual(201);
    expect(responseJson.status).toEqual('success');
    expect(responseJson.data.addedComment).toBeDefined();
    expect(responseJson.data.addedComment.id).toBeDefined();
    expect(responseJson.data.addedComment.content).toBeDefined();
    expect(responseJson.data.addedComment.owner).toBeDefined();
  });
});
