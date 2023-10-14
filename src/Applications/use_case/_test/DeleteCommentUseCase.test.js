const AuthorizationError = require('../../../Commons/exceptions/AuthorizationError');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');
const CommentRepository = require('../../../Domains/comments/CommentRepository');
const DeleteCommentUseCase = require('../DeleteCommentUseCase');

describe('DeleteCommentUseCase', () => {
  it('should throw error when comment is not exists', async () => {
    // Arrange
    const useCaseParams = {
      threadId: 'thread-123',
      commentId: 'comment-123',
    };
    const owner = 'user-123';
    const mockCommentRepository = new CommentRepository();

    mockCommentRepository.checkCommentIsExists = jest
      .fn(() => Promise.reject(new NotFoundError()));

    const deleteCommentUseCase = new DeleteCommentUseCase({ commentRepository: mockCommentRepository });

    // Action and Assert
    await expect(deleteCommentUseCase.execute(useCaseParams, owner))
      .rejects.toThrow(NotFoundError);
    expect(mockCommentRepository.checkCommentIsExists)
      .toBeCalledWith(useCaseParams.commentId);
  });

  it('should throw error when user is not owner of the comment', async () => {
    // Arrange
    const useCaseParams = {
      threadId: 'thread-123',
      commentId: 'comment-123',
    };
    const owner = 'invalidUser';
    const mockCommentRepository = new CommentRepository();

    mockCommentRepository.checkCommentIsExists = jest.fn(() => Promise.resolve());
    mockCommentRepository.verifyCommentOwner = jest
      .fn(() => Promise.reject(new AuthorizationError()));

    const deleteCommentUseCase = new DeleteCommentUseCase({ commentRepository: mockCommentRepository });

    // Action and Assert
    await expect(deleteCommentUseCase.execute(useCaseParams, owner))
      .rejects.toThrow(AuthorizationError);
    expect(mockCommentRepository.checkCommentIsExists)
      .toBeCalledWith(useCaseParams.commentId);
    expect(mockCommentRepository.verifyCommentOwner)
      .toBeCalledWith(useCaseParams.commentId, owner);
  });

  it('should orchestrating the delete comment action correctly', async () => {
    // Arrange
    const useCaseParams = {
      threadId: 'thread-123',
      commentId: 'comment-123',
    };
    const owner = 'user-123';
    const mockCommentRepository = new CommentRepository({});
    mockCommentRepository.checkCommentIsExists = jest.fn(() => Promise.resolve());
    mockCommentRepository.verifyCommentOwner = jest.fn(() => Promise.resolve());
    mockCommentRepository.deleteCommentById = jest.fn(() => Promise.resolve());

    const deleteCommentUseCase = new DeleteCommentUseCase({
      commentRepository: mockCommentRepository,
    });

    // Action
    await expect(deleteCommentUseCase.execute(useCaseParams, owner))
      .resolves.not.toThrow(Error);
    expect(mockCommentRepository.checkCommentIsExists)
      .toBeCalledWith(useCaseParams.commentId);
    expect(mockCommentRepository.verifyCommentOwner)
      .toBeCalledWith(useCaseParams.commentId, owner);
    expect(mockCommentRepository.deleteCommentById)
      .toBeCalledWith(useCaseParams.commentId);
  });
});
