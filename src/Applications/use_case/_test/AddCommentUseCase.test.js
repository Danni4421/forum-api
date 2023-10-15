const AddCommentUseCase = require('../AddCommentUseCase');
const CreateComment = require('../../../Domains/comments/entities/CreateComment');
const AddedComment = require('../../../Domains/comments/entities/AddedComment');
const CommentRepository = require('../../../Domains/comments/CommentRepository');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');

describe('AddCommentUseCase', () => {
  it('should throw error when thread is not exists', async () => {
    // Arrange
    const threadId = 'invalid-thread';
    const userId = 'user-123';
    const commentUseCasePayload = {
      content: 'ini sebuah komentar',
    };

    const mockCommentRepository = new CommentRepository();
    const mockThreadRepository = new ThreadRepository();

    mockThreadRepository.verifyThreadById = jest
      .fn(() => Promise.reject(new NotFoundError()));
    mockCommentRepository.addComment = jest
      .fn(() => Promise.resolve([]));

    const addCommentUseCase = new AddCommentUseCase({
      commentRepository: mockCommentRepository,
      threadRepository: mockThreadRepository
    });

    // Action and
    await expect(addCommentUseCase.execute(commentUseCasePayload, threadId, userId))
      .rejects.toThrow(NotFoundError);
  });

  it('should orchestrating the add comment use case correctly', async () => {
    // Arrange
    const commentUseCasePayload = {
      content: 'ini sebuah komentar',
    };
    const commentUseCaseParams = {
      threadId: 'thread-123'
    };
    const owner = 'user-123';
    const expectedAddedComment = new AddedComment({
      id: 'comment-123',
      content: commentUseCasePayload.content,
      owner,
    });
    const mockCommentRepository = new CommentRepository();
    const mockThreadRepository = new ThreadRepository();

    mockCommentRepository.addComment = jest
      .fn(() => Promise.resolve(new AddedComment({
        id: 'comment-123',
        content: 'ini sebuah komentar',
        owner: 'user-123',
      })));
    mockThreadRepository.verifyThreadById = jest
      .fn(() => Promise.resolve());

    const addCommentUseCase = new AddCommentUseCase({
      commentRepository: mockCommentRepository,
      threadRepository: mockThreadRepository,
    });

    // Action
    const addedComment = await addCommentUseCase.execute(commentUseCasePayload, commentUseCaseParams, owner);

    // Assert
    expect(addedComment).toStrictEqual(expectedAddedComment);
    expect(mockThreadRepository.verifyThreadById).toBeCalledWith(commentUseCaseParams.threadId);
    expect(mockCommentRepository.addComment).toBeCalledWith(
      new CreateComment({
        content: commentUseCasePayload.content,
        threadId: commentUseCaseParams.threadId,
        owner,
      })
    );
  });
});
