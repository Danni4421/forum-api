const ThreadRepositoryPostgres = require('../ThreadRepositoryPostgres');
const RegisterUser = require('../../../Domains/users/entities/RegisterUser');
const CreateThread = require('../../../Domains/threads/entities/CreateThread');
const AddedThread = require('../../../Domains/threads/entities/AddedThread');
const pool = require('../../database/postgres/pool');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');
const AuthorizationError = require('../../../Commons/exceptions/AuthorizationError');

describe('ThreadRepositoryPostgres', () => {
  afterEach(async () => {
    await ThreadsTableTestHelper.cleanTable();
  });

  beforeAll(async () => {
    const id = 'user-123';
    const registerUser = new RegisterUser({
      username: 'ajhmdni',
      password: 'secret_password',
      fullname: 'Aji Hamdani Ahmad',
    });
    await UsersTableTestHelper.addUser({ id, ...registerUser });
  });

  afterAll(async () => {
    await UsersTableTestHelper.cleanTable();
    await pool.end();
  });

  class FakeDateGenerator {
    constructor() {
      this.toISOString = () => '2021-01-01';
    }
  }

  describe('addThread function', () => {
    it('should persist create thread and return added thread correctly', async () => {
      // Arrange
      const createThread = new CreateThread({
        title: 'Clean Architecture',
        body: 'clean architecture is the best',
        owner: 'user-123',
      });
      const fakeIdGenerator = () => '123';

      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, fakeIdGenerator, FakeDateGenerator);

      // Action
      await threadRepositoryPostgres.addThread(createThread);

      // Assert
      const thread = await ThreadsTableTestHelper.findThreadById(`thread-${fakeIdGenerator()}`);
      expect(thread).toHaveLength(1);
    });

    it('should return added thread correctly', async () => {
      // Arrange
      const createThread = new CreateThread({
        title: 'Clean Architecture',
        body: 'clean architecture is the best',
        owner: 'user-123',
      });
      const fakeIdGenerator = () => '123';

      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, fakeIdGenerator, FakeDateGenerator);

      // Action
      const addedThread = await threadRepositoryPostgres.addThread(createThread);

      // Assert
      expect(addedThread).toStrictEqual(
        new AddedThread({
          id: 'thread-123',
          title: 'Clean Architecture',
          owner: 'user-123',
        })
      );
    });
  });

  describe('verifyThreadById function', () => {
    it('should throw error when thread is not exists', async () => {
      // Arrange
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {}, {});

      // Action and Assert
      await expect(threadRepositoryPostgres.verifyThreadById('123')).rejects.toThrow(NotFoundError);
    });

    it('should not throw error when thread is exists', async () => {
      // Arrange
      const createThread = new CreateThread({
        title: 'Clean Architecture',
        body: 'clean architecture is the best',
        owner: 'user-123',
      });
      const fakeIdGenerator = () => '123';

      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, fakeIdGenerator, FakeDateGenerator);

      // Action
      const { id } = await threadRepositoryPostgres.addThread(createThread);

      // Assert
      await expect(threadRepositoryPostgres.verifyThreadById(id)).resolves.not.toThrow(NotFoundError);
    });
  });

  describe('verifyThreadOwner function', () => {
    it('should throw error when user is not the owner of the thread', async () => {
      // Arrange
      const createThread = new CreateThread({
        title: 'Clean Architecture',
        body: 'clean architecture is the best',
        owner: 'user-123',
      });
      const fakeIdGenerator = () => '123';

      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, fakeIdGenerator, FakeDateGenerator);

      // Action
      const { id: threadId } = await threadRepositoryPostgres.addThread(createThread);

      // Assert
      await expect(threadRepositoryPostgres.verifyThreadOwner(threadId, 'invalidOwner'))
        .rejects.toThrow(AuthorizationError);
    });

    it('should not throw error when user is the owner of the thread', async () => {
      // Arrange
      const createThread = new CreateThread({
        title: 'Clean Architecture',
        body: 'clean architecture is the best',
        owner: 'user-123',
      });
      const fakeIdGenerator = () => '123';

      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, fakeIdGenerator, FakeDateGenerator);

      // Action
      const { id: threadId } = await threadRepositoryPostgres.addThread(createThread);

      // Assert
      await expect(threadRepositoryPostgres.verifyThreadOwner(threadId, 'user-123'))
        .resolves.not.toThrow(AuthorizationError);
    });
  });

  describe('getThreadById function', () => {
    let thread;

    beforeEach(async () => {
      // Arrange
      const createThread = new CreateThread({
        title: 'sebuah thread',
        body: 'isi sebuah thread',
        owner: 'user-123',
      });
      const fakeIdGenerator = () => '123';

      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, fakeIdGenerator, FakeDateGenerator);

      // Action
      thread = await threadRepositoryPostgres.addThread(createThread);
    });

    afterEach(async () => {
      await ThreadsTableTestHelper.cleanTable();
    });

    it('should throw error when thread is not exists', async () => {
      // Arrange
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {}, {});

      // Action and Assert
      await expect(threadRepositoryPostgres.getThreadById('invalidId')).rejects.toThrow(NotFoundError);
    });

    it('should not throw error and return detail thread when given valid threadId', async () => {
      // Arrange
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {}, {});

      // Action
      const detailThread = await threadRepositoryPostgres.getThreadById(thread.id);

      // Assert
      expect(detailThread.id).toEqual(thread.id);
      expect(detailThread.title).toEqual(thread.title);
      expect(detailThread.body).toEqual('isi sebuah thread');
      expect(detailThread.username).toEqual('ajhmdni');
    });
  });

  describe('deleteThreadById function', () => {
    it('should have no thread when permanently deleted', async () => {
      // Arrange
      const createThread = new CreateThread({
        title: 'sebuah thread',
        body: 'isi sebuah thread',
        owner: 'user-123',
      });
      const fakeIdGenerator = () => '123';

      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, fakeIdGenerator, FakeDateGenerator);

      // Action
      const { id } = await threadRepositoryPostgres.addThread(createThread);
      const threadBeforeDelete = await ThreadsTableTestHelper.findThreadById(id);
      await threadRepositoryPostgres.deleteThreadById(id);
      const threadAfterDelete = await ThreadsTableTestHelper.findThreadById(id);

      // Assert
      expect(threadBeforeDelete).toHaveLength(1);
      expect(threadAfterDelete).toHaveLength(0);
    });
  });
});
