const AddLike = require('../../../Domains/likes/entities/AddLike');
const CreateThread = require('../../../Domains/threads/entities/CreateThread');
const RegisterUser = require('../../../Domains/users/entities/RegisterUser');
const CreateComment = require('../../../Domains/comments/entities/CreateComment');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const LikesTableTestHelper = require('../../../../tests/LikesTableTestHelper');
const LikeRepositoryPostgres = require('../LikeRepositoryPostgres');
const pool = require('../../database/postgres/pool');

describe('LikeRepositoryPostgres', () => {
  beforeAll(async () => {
    // Arrange
    /** add user */
    const registerUser = new RegisterUser({
      username: 'ajhmdni',
      password: 'super_secret',
      fullname: 'Aji Hamdani Ahmad',
    });
    /** add thread */
    const createThread = new CreateThread({
      title: 'sebuah thread',
      body: 'isi dari sebuah thread',
      owner: 'user-123',
    });
    /** add comment */
    const createComment = new CreateComment({
      content: 'sebuah komentar',
      threadId: 'thread-123',
      owner: 'user-123',
    });

    // Action
    await UsersTableTestHelper.addUser({ id: 'user-123', ...registerUser });
    await ThreadsTableTestHelper.addThread({ id: 'thread-123', ...createThread });
    await CommentsTableTestHelper.addComment({ id: 'comment-123', ...createComment });
  });

  afterAll(async () => {
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
    await pool.end();
  });

  afterEach(async () => {
    await LikesTableTestHelper.cleanTable();
  });

  describe('addLike function', () => {
    it('should persist add like comment correctly', async () => {
      // Arrange
      const addLikePayload = new AddLike({
        commentId: 'comment-123',
        owner: 'user-123',
      });
      const fakeIdGenerator = () => '123';
      const likeRepositoryPostgres = new LikeRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      await likeRepositoryPostgres.addLike(addLikePayload);

      // Assert
      const likes = await LikesTableTestHelper.findLikes('comment-123');
      expect(likes).toHaveLength(1);
    });
  });

  describe('checkLikeIsExists function', () => {
    it('should throw error when like is not exists', async () => {
      // Arrange
      const likeRepositoryPostgres = new LikeRepositoryPostgres(pool, {});

      // Action and Assert
      await expect(likeRepositoryPostgres.checkLikeIsExists('comment-123', 'user-123'))
        .resolves.toEqual(false);
    });

    it('should not throw error when like is exists', async () => {
      // Arrange
      const addLikePayload = new AddLike({
        commentId: 'comment-123',
        owner: 'user-123',
      });
      const fakeIdGenerator = () => '123';
      const likeRepositoryPostgres = new LikeRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      await likeRepositoryPostgres.addLike(addLikePayload);

      // Assert
      await expect(likeRepositoryPostgres.checkLikeIsExists('comment-123', 'user-123'))
        .resolves.toEqual(true);
    });
  });

  describe('getLikesByCommentId function', () => {
    it('should return the value 0 if there is no one to like', async () => {
      // Arrange
      const likeRepositoryPostgres = new LikeRepositoryPostgres(pool, {});

      // Action
      const likes = await likeRepositoryPostgres.getLikesByCommentId('comment-123');

      // Assert
      expect(likes).toEqual(0);
    });

    it('It should return a like value if there are likes in the comment', async () => {
      // Arrange
      const addLikePayload = new AddLike({
        commentId: 'comment-123',
        owner: 'user-123',
      });
      const fakeIdGenerator = () => '123';
      const likeRepositoryPostgres = new LikeRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      await likeRepositoryPostgres.addLike(addLikePayload);
      const likes = await likeRepositoryPostgres.getLikesByCommentId('comment-123');

      // Assert
      expect(likes).toEqual(1);
    });
  });

  describe('deleteLike function', () => {
    it('it should return the value 0 if the like has been deleted', async () => {
      // Arrange
      const addLikePayload = new AddLike({
        commentId: 'comment-123',
        owner: 'user-123',
      });
      const fakeIdGenerator = () => '123';
      const likeRepositoryPostgres = new LikeRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      await likeRepositoryPostgres.addLike(addLikePayload);
      const getLikeBeforeDeleted = await likeRepositoryPostgres
        .getLikesByCommentId('comment-123');
      await likeRepositoryPostgres.deleteLike('comment-123', 'user-123');
      const getLikeAfterDeleted = await likeRepositoryPostgres
        .getLikesByCommentId('comment-123');

      // Assert
      expect(getLikeBeforeDeleted).toEqual(1);
      expect(getLikeAfterDeleted).toEqual(0);
    });
  });
});
