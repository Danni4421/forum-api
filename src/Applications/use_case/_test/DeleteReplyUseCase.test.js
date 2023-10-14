const DeleteReplyUseCase = require('../DeleteReplyUseCase');
const ReplyRepository = require('../../../Domains/replies/ReplyRepository');
const AuthorizationError = require('../../../Commons/exceptions/AuthorizationError');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');

describe('DeleteReplyUseCase', () => {
  it('should throw error when reply is not exists', async () => {
    // Arrange
    const owner = 'user-123';
    const useCaseParams = {
      replyId: 'reply-123',
    };
    const mockReplyRepository = new ReplyRepository();
    mockReplyRepository.checkReplyIsExists = jest.fn(() => Promise.reject(new NotFoundError()));
    mockReplyRepository.verifyReplyOwner = jest.fn(() => Promise.resolve());
    mockReplyRepository.deleteReplyById = jest.fn(() => Promise.resolve());

    const deleteReplyUseCase = new DeleteReplyUseCase({ replyRepository: mockReplyRepository });

    // Action and Assert
    await expect(deleteReplyUseCase.execute(useCaseParams, owner))
      .rejects.toThrow(NotFoundError);
    expect(mockReplyRepository.checkReplyIsExists)
      .toBeCalledWith(useCaseParams.replyId);
  });

  it('should throw error when user is not owner of the reply', async () => {
    // Arrange
    const owner = 'user-123';
    const useCaseParams = {
      replyId: 'reply-123',
    };
    const mockReplyRepository = new ReplyRepository();
    mockReplyRepository.checkReplyIsExists = jest.fn(() => Promise.resolve());
    mockReplyRepository.verifyReplyOwner = jest
      .fn(() => Promise.reject(new AuthorizationError()));
    mockReplyRepository.deleteReplyById = jest.fn(() => Promise.resolve());

    const deleteReplyUseCase = new DeleteReplyUseCase({ replyRepository: mockReplyRepository });

    // Action and Assert
    await expect(deleteReplyUseCase.execute(useCaseParams, owner))
      .rejects.toThrow(AuthorizationError);
    expect(mockReplyRepository.checkReplyIsExists)
      .toBeCalledWith(useCaseParams.replyId);
    expect(mockReplyRepository.verifyReplyOwner)
      .toBeCalledWith(useCaseParams.replyId, owner);
  });

  it('should orchestrating the delete reply action correctly', async () => {
    // Arrange
    const owner = 'user-123';
    const useCaseParams = {
      replyId: 'reply-123',
    };
    const mockReplyRepository = new ReplyRepository();
    mockReplyRepository.checkReplyIsExists = jest.fn(() => Promise.resolve());
    mockReplyRepository.verifyReplyOwner = jest.fn(() => Promise.resolve());
    mockReplyRepository.deleteReplyById = jest.fn(() => Promise.resolve());

    const deleteReplyUseCase = new DeleteReplyUseCase({ replyRepository: mockReplyRepository });

    // Action and Assert
    await expect(deleteReplyUseCase.execute(useCaseParams, owner))
      .resolves.not.toThrow(Error);
    expect(mockReplyRepository.checkReplyIsExists)
      .toBeCalledWith(useCaseParams.replyId);
    expect(mockReplyRepository.verifyReplyOwner)
      .toBeCalledWith(useCaseParams.replyId, owner);
    expect(mockReplyRepository.deleteReplyById)
      .toBeCalledWith(useCaseParams.replyId);
  });
});
