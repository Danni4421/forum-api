const AddedComment = require('../../../Domains/comments/entities/AddedComment');
const AuthorizationError = require('../../../Commons/exceptions/AuthorizationError');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const CreateComment = require('../../../Domains/comments/entities/CreateComment');
const CreateThread = require('../../../Domains/threads/entities/CreateThread');
const CommentRepositoryPostgres = require('../CommentRepositoryPostgres');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');
const pool = require('../../database/postgres/pool');
const RegisterUser = require('../../../Domains/users/entities/RegisterUser');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');

describe('CommentRepositoryPostgres', () => {
  const userId = 'user-123';
  const threadId = 'thread-123';

  beforeAll(async () => {
    // Arrange
    const registerUser = new RegisterUser({
      username: 'ajhmdni',
      password: 'super_secret',
      fullname: 'Aji Hamdani Ahmad',
    });
    const createThread = new CreateThread({
      title: 'sebuah thread',
      body: 'isi dari sebuah thread',
      owner: userId,
    });

    // Action
    await UsersTableTestHelper.addUser({ id: userId, ...registerUser });
    await ThreadsTableTestHelper.addThread({ id: threadId, ...createThread });
  });

  afterEach(async () => {
    await CommentsTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
    await pool.end();
  });

  class FakeDateGenerator {
    constructor() {
      this.toISOString = () => '2021-01-01';
    }
  }

  describe('addComment function', () => {
    it('should persist create comment and return added comment correctly', async () => {
      // Arrange
      const createComment = new CreateComment({
        content: 'comment sebuah thread',
        threadId,
        owner: userId,
      });
      const fakeIdGenerator = () => '123';

      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, fakeIdGenerator, FakeDateGenerator);

      // Action
      await commentRepositoryPostgres.addComment(createComment);

      // Assert
      const comment = await CommentsTableTestHelper.findComments(threadId);
      expect(comment).toHaveLength(1);
    });

    it('should return added comment correctly', async () => {
      // Arrange
      const createComment = new CreateComment({
        content: 'comment sebuah thread',
        threadId,
        owner: userId,
      });
      const fakeIdGenerator = () => '123';

      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, fakeIdGenerator, FakeDateGenerator);

      // Action
      const addedComment = await commentRepositoryPostgres.addComment(createComment);

      // Assert
      expect(addedComment).toStrictEqual(
        new AddedComment({
          id: `comment-${fakeIdGenerator()}`,
          content: 'comment sebuah thread',
          owner: userId,
        })
      );
    });
  });

  describe('checkCommentIsExists function', () => {
    it('should throw error when comment is not exists', async () => {
      // Arrange
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {}, {});

      // Action and Assert
      await expect(commentRepositoryPostgres.checkCommentIsExists({ threadId, commentId: 'undefinedCommentId' }))
        .rejects.toThrow(NotFoundError);
    });

    it('should not throw error when comment is exists', async () => {
      // Arrange
      const createComment = new CreateComment({
        content: 'comment sebuah thread',
        threadId,
        owner: userId,
      });
      await CommentsTableTestHelper.addComment({ ...createComment, id: 'comment-123' });
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {}, {});

      // Action and Assert
      await expect(commentRepositoryPostgres.checkCommentIsExists('comment-123'))
        .resolves.not.toThrow(NotFoundError);
    });
  });

  describe('checkCommentIsPartOfThread function', () => {
    it('should throw error when comment is not part of thread', async () => {
      // Arrange
      const createComment = new CreateComment({
        content: 'comment sebuah thread',
        threadId,
        owner: userId
      });
      await CommentsTableTestHelper.addComment({ ...createComment, id: 'comment-123' });
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {}, {});

      // Action and Assert
      await expect(commentRepositoryPostgres.checkCommentIsPartOfThread('', 'comment-123'))
        .rejects.toThrowError('komentar bukan termasuk ke dalam thread');
    });

    it('should resolve when comment is part of thread', async () => {
      // Arrange
      const createComment = new CreateComment({
        content: 'comment sebuah thread',
        threadId,
        owner: userId,
      });
      await CommentsTableTestHelper.addComment({ ...createComment, id: 'comment-123' });
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {}, {});

      // Action and Assert
      await expect(commentRepositoryPostgres.checkCommentIsPartOfThread(threadId, 'comment-123'))
        .resolves.not.toThrow(NotFoundError);
    });
  });

  describe('getCommentByThreadId function', () => {
    it('should throw error when get comment with invalid thread id', async () => {
      // Arrange
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {}, {});

      // Action
      const comments = await commentRepositoryPostgres.getCommentByThreadId('invalidThreadId');

      // Assert
      expect(comments).toHaveLength(0);
    });

    it('should return comment when get comment with valid thread id', async () => {
      // Arrange
      const createComment = new CreateComment({
        content: 'comment sebuah thread',
        threadId,
        owner: userId,
      });
      const fakeIdGenerator = () => '123';

      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, fakeIdGenerator, FakeDateGenerator);

      // Action
      await commentRepositoryPostgres.addComment(createComment);
      const [comment] = await commentRepositoryPostgres.getCommentByThreadId(threadId);

      // Assert
      expect(comment.id).toEqual('comment-123');
      expect(comment.content).toEqual(createComment.content);
      expect(comment.date).toEqual('2021-01-01');
      expect(comment.username).toEqual('ajhmdni');
      expect(comment.isDeleted).toEqual(false);
    });
  });

  describe('deleteCommentById function', () => {
    it('should response 404 when given comment with invalid id', async () => {
      // Arrange
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {}, {});

      // Action and Assert
      await expect(commentRepositoryPostgres.deleteCommentById(''))
        .rejects.toThrow(NotFoundError);
    });

    it('should success deleting comment when given comment with valid id', async () => {
      // Arrange
      const createComment = new CreateComment({
        content: 'comment sebuah thread',
        threadId,
        owner: userId,
      });
      const fakeIdGenerator = () => '123';

      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, fakeIdGenerator, FakeDateGenerator);
      await commentRepositoryPostgres.addComment(createComment);

      // Action and Assert
      await expect(commentRepositoryPostgres.deleteCommentById(`comment-${fakeIdGenerator()}`))
        .resolves.not.toThrow(NotFoundError);
    });

    describe('verifyCommentOwner function', () => {
      it('should throw error when user is not the comment owner', async () => {
        // Arrange
        const createComment = new CreateComment({
          content: 'comment sebuah thread',
          threadId,
          owner: userId,
        });
        const fakeIdGenerator = () => '123';

        const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, fakeIdGenerator, FakeDateGenerator);
        await commentRepositoryPostgres.addComment(createComment);

        // Action and Assert
        await expect(commentRepositoryPostgres
          .verifyCommentOwner({ threadId, commentId: `comment-${fakeIdGenerator()}` }, 'xxxx'))
          .rejects.toThrow(AuthorizationError);
      });

      it('should success verify comment with the right owner', async () => {
        // Arrange
        const createComment = new CreateComment({
          content: 'comment sebuah thread',
          threadId,
          owner: userId,
        });
        const fakeIdGenerator = () => '123';

        const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, fakeIdGenerator, FakeDateGenerator);
        await commentRepositoryPostgres.addComment(createComment);

        // Action and Assert
        await expect(commentRepositoryPostgres
          .verifyCommentOwner(`comment-${fakeIdGenerator()}`, userId))
          .resolves.not.toThrow(AuthorizationError);
      });
    });
  });
});
