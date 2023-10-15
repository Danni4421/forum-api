const AddThreadUseCase = require('../AddThreadUseCase');
const AddedThread = require('../../../Domains/threads/entities/AddedThread');
const CreateThread = require('../../../Domains/threads/entities/CreateThread');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');

describe('AddThreadUseCase', () => {
  it('should orchestrating the add thread use case correctly', async () => {
    // Arrange
    const threadUseCasePayload = {
      title: 'sebuah thread',
      body: 'content dari thread',
    };
    const expectedAddedThread = new AddedThread({
      id: 'thread-123',
      title: threadUseCasePayload.title,
      owner: 'user-123',
    });

    const mockThreadRepository = new ThreadRepository();

    mockThreadRepository.addThread = jest
      .fn(() => Promise.resolve(new AddedThread({
        id: 'thread-123',
        title: 'sebuah thread',
        owner: 'user-123',
      })));

    const addThreadUseCase = new AddThreadUseCase({ threadRepository: mockThreadRepository });

    // Action
    const addedThread = await addThreadUseCase.execute(threadUseCasePayload, 'user-123');

    // Assert
    expect(addedThread).toStrictEqual(expectedAddedThread);
    expect(mockThreadRepository.addThread).toBeCalledWith(
      new CreateThread({
        title: threadUseCasePayload.title,
        body: threadUseCasePayload.body,
        owner: 'user-123',
      })
    );
  });
});
