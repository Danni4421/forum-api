const UserTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const AuthenticationsTableTestHelper = require('../../../../tests/AuthenticationsTableTestHelper');
const ThreadTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const CommentTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const LikesTableTestHelper = require('../../../../tests/LikesTableTestHelper');
const createServer = require('../createServer');
const container = require('../../container');
const pool = require('../../database/postgres/pool');

describe('/likes endpoint', () => {
  const neededProperty = {};

  beforeAll(async () => {
    // Arrange
    /** add user payload */
    const postUserPayload = {
      username: 'ajhmdni',
      password: 'supersecret',
      fullname: 'Aji Hamdani Ahmad',
    };
    /** add authentication payload */
    const postAuthenticationPayload = {
      username: 'ajhmdni',
      password: 'supersecret',
    };
    /** add thread payload */
    const postThreadPayload = {
      title: 'sebuah thread',
      body: 'isi dari sebuah thread',
    };
    /** add comment payload */
    const postCommentPayload = {
      content: 'sebuah komentar',
    };
    const server = await createServer(container);

    // Action
    /** post user */
    const { addedUser: { id: userId } } = await server.inject({
      method: 'POST',
      url: '/users',
      payload: postUserPayload,
    }).then((response) => {
      const responseJson = JSON.parse(response.payload);
      return responseJson.data;
    });
    neededProperty.userId = userId;

    /** post authentication */
    const { accessToken } = await server.inject({
      method: 'POST',
      url: '/authentications',
      payload: postAuthenticationPayload,
    }).then((response) => {
      const responseJson = JSON.parse(response.payload);
      return responseJson.data;
    });
    neededProperty.accessToken = accessToken;

    /** post thread */
    const { addedThread: { id: threadId } } = await server.inject({
      method: 'POST',
      url: '/threads',
      payload: postThreadPayload,
      headers: {
        Authorization: `Bearer ${neededProperty.accessToken}`,
      },
    }).then((response) => {
      const responseJson = JSON.parse(response.payload);
      return responseJson.data;
    });
    neededProperty.threadId = threadId;

    /** post comment */
    const { addedComment: { id: commentId } } = await server.inject({
      method: 'POST',
      url: `/threads/${neededProperty.threadId}/comments`,
      payload: postCommentPayload,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }).then((response) => {
      const responseJson = JSON.parse(response.payload);
      return responseJson.data;
    });
    neededProperty.commentId = commentId;
  });

  afterAll(async () => {
    await CommentTableTestHelper.cleanTable();
    await ThreadTableTestHelper.cleanTable();
    await AuthenticationsTableTestHelper.cleanTable();
    await UserTableTestHelper.cleanTable();
    await pool.end();
  });

  afterEach(async () => {
    await LikesTableTestHelper.cleanTable();
  });

  describe('when the user has never given a like', () => {
    it('should response 200 with status success when put like to a comment', async () => {
      // Arrange
      const server = await createServer(container);

      // Action
      await server.inject({
        method: 'PUT',
        url: `/threads/${neededProperty.threadId}/comments/${neededProperty.commentId}/likes`,
        headers: {
          Authorization: `Bearer ${neededProperty.accessToken}`,
        },
      });

      const { thread } = await server.inject({
        method: 'GET',
        url: `/threads/${neededProperty.threadId}`,
      }).then((response) => {
        const responseJson = JSON.parse(response.payload);
        return responseJson.data;
      });

      // Assert
      const [comment] = thread.comments;
      expect(comment.likeCount).toEqual(1);
    });
  });

  describe('when a user has already given a like', () => {
    it('should response 200 with status success when put like to a comment', async () => {
      // Arrange
      const server = await createServer(container);

      // Action
      /** first action */
      await server.inject({
        method: 'PUT',
        url: `/threads/${neededProperty.threadId}/comments/${neededProperty.commentId}/likes`,
        headers: {
          Authorization: `Bearer ${neededProperty.accessToken}`,
        },
      });

      /** second action */
      await server.inject({
        method: 'PUT',
        url: `/threads/${neededProperty.threadId}/comments/${neededProperty.commentId}/likes`,
        headers: {
          Authorization: `Bearer ${neededProperty.accessToken}`,
        },
      });

      const { thread } = await server
        .inject({
          method: 'GET',
          url: `/threads/${neededProperty.threadId}`,
        })
        .then((response) => {
          const responseJson = JSON.parse(response.payload);
          return responseJson.data;
        });

      // Assert
      const [comment] = thread.comments;
      expect(comment.likeCount).toEqual(0);
    });
  });
});
