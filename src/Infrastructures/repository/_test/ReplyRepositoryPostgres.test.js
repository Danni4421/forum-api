const AddedComment = require('../../../Domains/comments/entities/AddedComment');
const AddedThread = require('../../../Domains/threads/entities/AddedThread');
const AddedReply = require('../../../Domains/replies/entities/AddedReply');
const AuthorizationError = require('../../../Commons/exceptions/AuthorizationError');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const CreateReply = require('../../../Domains/replies/entities/CreateReply');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');
const pool = require('../../database/postgres/pool');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const ReplyRepositoryPostgres = require('../ReplyRepositoryPostgres');
const RegisteredUser = require('../../../Domains/users/entities/RegisteredUser');
const RepliesTableTestHelper = require('../../../../tests/RepliesTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');

describe('ReplyRepositoryPostgres', () => {
  beforeAll(async () => {
    // Arrange
    /** add user */
    const registeredUser1 = new RegisteredUser({
      id: 'user-123',
      username: 'ajhmdni',
      fullname: 'Aji Hamdani Ahmad',
    });

    const registeredUser2 = new RegisteredUser({
      id: 'user-234',
      username: 'johndoe',
      fullname: 'John Doe',
    });

    await UsersTableTestHelper.addUser({ ...registeredUser1, password: 'super_secret' });
    await UsersTableTestHelper.addUser({ ...registeredUser2, password: 'secret' });

    /** add thread */
    const addedThread = new AddedThread({
      id: 'thread-123',
      title: 'sebuah thread',
      owner: 'user-123',
    });

    await ThreadsTableTestHelper.addThread({ ...addedThread, body: 'isi sebuah thread' });

    /** add comment */
    const addedComment = new AddedComment({
      id: 'comment-123',
      content: 'sebuah comment',
      owner: 'user-123',
    });

    await CommentsTableTestHelper.addComment({ ...addedComment, threadId: addedThread.id });
  });

  afterAll(async () => {
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
    await pool.end;
  });

  afterEach(async () => {
    await RepliesTableTestHelper.cleanTable();
  });

  class FakeDateGenerator {
    constructor() {
      this.toISOString = () => '2021-01-01';
    }
  }

  describe('addReply function', () => {
    it('should persist create reply and return added reply correctly', async () => {
      // Arrange
      const createReply = new CreateReply({
        commentId: 'comment-123',
        content: 'sebuah balasan',
        owner: 'user-234',
      });

      const fakeIdGenerator = () => '123';

      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, fakeIdGenerator, FakeDateGenerator);

      // Action
      const { id, content, owner } = await replyRepositoryPostgres.addReply(createReply);

      // Assert
      const replies = await RepliesTableTestHelper.findReplies('comment-123');
      const [reply] = replies;
      expect(replies).toHaveLength(1);
      expect(id).toEqual(reply.id);
      expect(content).toEqual(reply.content);
      expect(owner).toEqual(reply.owner);
    });

    it('should return added reply correctly', async () => {
      // Arrange
      const createReply = new CreateReply({
        commentId: 'comment-123',
        content: 'sebuah balasan',
        owner: 'user-234',
      });

      const fakeIdGenerator = () => '123';

      const expectedAddedReply = new AddedReply({
        id: 'reply-123',
        content: 'sebuah balasan',
        owner: 'user-234',
      });

      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, fakeIdGenerator, FakeDateGenerator);

      // Action
      const addedReply = await replyRepositoryPostgres.addReply(createReply);

      // Assert
      expect(addedReply).toStrictEqual(expectedAddedReply);
    });
  });

  describe('deleteReply function', () => {
    it('should throw error when delete reply with invalid id', async () => {
      // Arrange
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {}, {});

      // Action and Assert
      await expect(replyRepositoryPostgres.deleteReplyById('invalidId'))
        .rejects.toThrow(NotFoundError);
    });

    it('should persist delete reply function', async () => {
      // Arrange
      /** add reply */
      const createReply = new CreateReply({
        commentId: 'comment-123',
        content: 'sebuah balasan',
        owner: 'user-234',
      });

      const fakeIdGenerator = () => '123';

      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, fakeIdGenerator, FakeDateGenerator);

      // Action and Assert
      const { id } = await replyRepositoryPostgres.addReply(createReply);
      await expect(replyRepositoryPostgres.deleteReplyById(id)).resolves.not.toThrow(NotFoundError);
    });
  });

  describe('deleteReplyPermanentlyById function', () => {
    it('should have no reply when permanently deleted', async () => {
      // Arrange
      /** add reply */
      const createReply = new CreateReply({
        commentId: 'comment-123',
        content: 'sebuah balasan',
        owner: 'user-234',
      });

      const fakeIdGenerator = () => '123';

      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, fakeIdGenerator, FakeDateGenerator);

      // Action
      const { id } = await replyRepositoryPostgres.addReply(createReply);
      const repliesBeforeDelete = await RepliesTableTestHelper.findReplies('comment-123');
      await replyRepositoryPostgres.deleteReplyPermanentlyById(id);
      const repliesAfterDelete = await RepliesTableTestHelper.findReplies('comment-123');

      // Assert
      expect(repliesBeforeDelete).toHaveLength(1);
      expect(repliesAfterDelete).toHaveLength(0);
    });
  });

  describe('getReplyByThreadId function', () => {
    it('should persist get reply by thread id and return replies', async () => {
      // Arrange
      /** add reply */
      const createReply1 = new CreateReply({
        commentId: 'comment-123',
        content: 'sebuah balasan',
        owner: 'user-234',
      });
      const createReply2 = new CreateReply({
        commentId: 'comment-123',
        content: 'hii john doe',
        owner: 'user-123',
      });

      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {}, {});

      // Action
      await RepliesTableTestHelper.addReplies({ ...createReply1, id: 'reply-123' });
      await RepliesTableTestHelper.addReplies({ ...createReply2, id: 'reply-234' });
      const replies = await replyRepositoryPostgres.getReplyByThreadId('thread-123');

      // Assert
      expect(replies).toHaveLength(2);
    });

    it('should return deleted reply after deleting', async () => {
      // Arrange
      /** add reply */
      const createReply1 = new CreateReply({
        commentId: 'comment-123',
        content: 'sebuah balasan',
        owner: 'user-234',
      });
      const createReply2 = new CreateReply({
        commentId: 'comment-123',
        content: 'hii john doe',
        owner: 'user-123',
      });

      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {}, {});

      // Action
      await RepliesTableTestHelper.addReplies({ ...createReply1, id: 'reply-123' });
      const id = await RepliesTableTestHelper.addReplies({ ...createReply2, id: 'reply-234' });
      await replyRepositoryPostgres.deleteReplyById(id);
      const replies = await replyRepositoryPostgres.getReplyByThreadId('thread-123');

      // Assert
      const deletedReplies = replies.filter((reply) => reply.isDeleted);
      expect(deletedReplies).toHaveLength(1);
    });
  });

  describe('verifyReplyOwner function', () => {
    it('should throw AuthorizationError when userId is not reply owner', async () => {
      // Arrange
      /** add reply */
      const createReply = new CreateReply({
        commentId: 'comment-123',
        content: 'sebuah balasan',
        owner: 'user-234',
      });

      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {}, {});
      await RepliesTableTestHelper.addReplies({ ...createReply, id: 'reply-123' });

      // Action and Assert
      await expect(replyRepositoryPostgres.verifyReplyOwner('reply-123', 'user-123'))
        .rejects.toThrow(AuthorizationError);
    });

    it('should not throw error when userId is reply owner', async () => {
      // Arrange
      /** add reply */
      const createReply = new CreateReply({
        commentId: 'comment-123',
        content: 'sebuah balasan',
        owner: 'user-234',
      });

      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {}, {});
      await RepliesTableTestHelper.addReplies({ ...createReply, id: 'reply-123' });

      // Action and Assert
      await expect(replyRepositoryPostgres.verifyReplyOwner('reply-123', 'user-234'))
        .resolves.not.toThrow(AuthorizationError);
    });
  });

  describe('checkReplyIsExists function', () => {
    it('should throw NotFoundError when reply is not exists', async () => {
      // Arrange
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {}, {});

      // Action and Assert
      await expect(replyRepositoryPostgres.checkReplyIsExists('xxx'))
        .rejects.toThrow(NotFoundError);
    });

    it('should not throw NotFoundError when reply is exists', async () => {
      // Arrange
      /** add reply */
      const createReply = new CreateReply({
        commentId: 'comment-123',
        content: 'sebuah comment',
        owner: 'user-123',
      });

      // Action
      await RepliesTableTestHelper.addReplies({ ...createReply, id: 'reply-123' });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {}, {});

      // Assert
      await expect(replyRepositoryPostgres.checkReplyIsExists('reply-123'))
        .resolves.not.toThrow(NotFoundError);
    });
  });
});
