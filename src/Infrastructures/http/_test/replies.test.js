const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const RepliesTableTestHelper = require('../../../../tests/RepliesTableTestHelper');
const container = require('../../container');
const pool = require('../../database/postgres/pool');
const createServer = require('../createServer');

describe('/replies endpoint', () => {
  const neededProperty = {};

  beforeAll(async () => {
    // Arrange
    const postUserPayload = {
      username: 'ajhmdni',
      password: 'super_secret',
      fullname: 'Aji Hamdani Ahmad',
    };
    const postAuthenticationPayload = {
      username: 'ajhmdni',
      password: 'super_secret',
    };
    const postThreadPayload = {
      title: 'new thread',
      body: 'hello all'
    };
    const postCommentPayload = {
      content: 'sebuah komentar'
    };
    const server = await createServer(container);

    // Action
    /** add user */
    const { addedUser: { id: userId } } = await server.inject({
      method: 'POST',
      url: '/users',
      payload: postUserPayload,
    }).then((response) => {
      const responseJson = JSON.parse(response.payload);
      return responseJson.data;
    });
    neededProperty.owner = userId;

    /** add authentication */
    const { accessToken } = await server.inject({
      method: 'POST',
      url: '/authentications',
      payload: postAuthenticationPayload,
    }).then((response) => {
      const responseJson = JSON.parse(response.payload);
      return responseJson.data;
    });
    neededProperty.token = accessToken;

    /** add thread */
    const { addedThread: { id: threadId } } = await server.inject({
      method: 'POST',
      url: '/threads',
      payload: postThreadPayload,
      headers: {
        Authorization: `Bearer ${neededProperty.token}`
      }
    }).then((response) => {
      const responseJson = JSON.parse(response.payload);
      return responseJson.data;
    });
    neededProperty.threadId = threadId;

    const { addedComment: { id: commentId } } = await server.inject({
      method: 'POST',
      url: `/threads/${threadId}/comments`,
      payload: postCommentPayload,
      headers: {
        Authorization: `Bearer ${neededProperty.token}`,
      }
    }).then((response) => {
      const responseJson = JSON.parse(response.payload);
      return responseJson.data;
    });
    neededProperty.commentId = commentId;
  });

  afterAll(async () => {
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
    await pool.end();
  });

  afterEach(async () => {
    await RepliesTableTestHelper.cleanTable();
  });

  describe('/replies endpoint', () => {
    const replier = {};

    beforeAll(async () => {
      const server = await createServer(container);
      const { addedUser: { id } } = await server.inject({
        method: 'POST',
        url: '/users',
        payload: {
          username: 'johndoe',
          password: 'secret',
          fullname: 'John Doe',
        }
      }).then((response) => {
        const responseJson = JSON.parse(response.payload);
        return responseJson.data;
      });
      replier.userId = id;

      const { accessToken } = await server.inject({
        method: 'POST',
        url: '/authentications',
        payload: {
          username: 'johndoe',
          password: 'secret',
        },
      }).then((response) => {
        const responseJson = JSON.parse(response.payload);
        return responseJson.data;
      });
      replier.token = accessToken;
    });

    describe('when POST /replies', () => {
      it('should response 404 when comment is not found', async () => {
        // Arrange
        const postReplyPayload = {
          content: 'hallo aji'
        };
        const server = await createServer(container);

        // Action
        const response = await server.inject({
          method: 'POST',
          url: `/threads/${neededProperty.threadId}/comments/xxxx/replies`,
          payload: postReplyPayload,
          headers: {
            Authorization: `Bearer ${replier.token}`
          }
        });

        // Assert
        const responseJson = JSON.parse(response.payload);
        expect(response.statusCode).toEqual(404);
        expect(responseJson.status).toEqual('fail');
      });
    });

    describe('when getting replies from thread', () => {
      it('should not have replies when comment is deleted', async () => {
        // Arrange
        /** add deleted comment */
        const postCommentPayload = {
          content: 'sebuah komentar',
        };
        const postReplyPayload = {
          content: 'sebuah balasan',
        };
        const server = await createServer(container);

        const {
          addedComment: { id: commentId },
        } = await server
          .inject({
            method: 'POST',
            url: `/threads/${neededProperty.threadId}/comments`,
            payload: postCommentPayload,
            headers: {
              Authorization: `Bearer ${neededProperty.token}`,
            },
          })
          .then((response) => {
            const responseJson = JSON.parse(response.payload);
            return responseJson.data;
          });

        /** add reply */
        await server
          .inject({
            method: 'POST',
            url: `/threads/${neededProperty.threadId}/comments/${commentId}/replies`,
            payload: postReplyPayload,
            headers: {
              Authorization: `Bearer ${neededProperty.token}`,
            },
          })
          .then((response) => {
            const responseJson = JSON.parse(response.payload);
            return responseJson.data;
          });

        /** delete comments */
        await server.inject({
          method: 'DELETE',
          url: `/threads/${neededProperty.threadId}/comments/${commentId}`,
          headers: {
            Authorization: `Bearer ${neededProperty.token}`,
          },
        });

        // Action
        const response = await server.inject({
          method: 'GET',
          url: `/threads/${neededProperty.threadId}`,
        });

        // Assert
        const {
          data: { thread },
        } = JSON.parse(response.payload);
        const filteredComment = thread.comments
          .filter((comment) => comment.content === '**komentar telah dihapus**');
        const [comment] = filteredComment;
        expect(response.statusCode).toEqual(200);
        expect(filteredComment).toHaveLength(1);
        expect(comment.content).toEqual('**komentar telah dihapus**');
        expect(comment.replies).toHaveLength(0);
      });

      it('should have content **balasan telah dihapus** when reply deleted', async () => {
        // Arrange
        const postReplyPayload = {
          content: 'sebuah balasan',
        };
        const server = await createServer(container);

        /** add reply */
        const {
          addedReply: { id: replyId },
        } = await server
          .inject({
            method: 'POST',
            url: `/threads/${neededProperty.threadId}/comments/${neededProperty.commentId}/replies`,
            payload: postReplyPayload,
            headers: {
              Authorization: `Bearer ${replier.token}`,
            },
          })
          .then((response) => {
            const responseJson = JSON.parse(response.payload);
            return responseJson.data;
          });

        // Action
        await server.inject({
          method: 'DELETE',
          url: `/threads/${neededProperty.threadId}/comments/${neededProperty.commentId}/replies/${replyId}`,
          headers: {
            Authorization: `Bearer ${replier.token}`,
          },
        });

        const response = await server.inject({
          method: 'GET',
          url: `/threads/${neededProperty.threadId}`,
        });

        // Assert
        const {
          data: {
            thread: { comments },
          },
        } = JSON.parse(response.payload);
        const filteredComment = comments.filter((comment) => comment.content !== '**komentar telah dihapus**');
        const [comment] = filteredComment;
        expect(response.statusCode).toEqual(200);
        expect(comment.replies).toHaveLength(1);
        expect(comment.replies[0].content).toEqual('**balasan telah dihapus**');
      });
    });
  });
});
