const AddLikeUseCase = require('../AddLikeUseCase');
const AddLike = require('../../../Domains/likes/entities/AddLike');
const LikeRepository = require('../../../Domains/likes/LikeRepository');
const CommentRepository = require('../../../Domains/comments/CommentRepository');

describe('AddLikeUseCase', () => {
  it('should orchestrate the add like use case where not yet liked the comment', async () => {
    // Arrange
    const useCaseParams = {
      commentId: 'comment-123',
    };
    const owner = 'user-123';
    const mockCommentRepository = new CommentRepository();
    const mockLikeRepository = new LikeRepository();

    mockCommentRepository.checkCommentIsExists = jest.fn(() => Promise.resolve());
    mockCommentRepository.checkCommentIsPartOfThread = jest.fn(() => Promise.resolve());
    mockLikeRepository.checkLikeIsExists = jest.fn(() => Promise.resolve(false));
    mockLikeRepository.addLike = jest.fn(() => Promise.resolve());

    const addLikeUseCase = new AddLikeUseCase({
      commentRepository: mockCommentRepository,
      likeRepository: mockLikeRepository
    });

    // Action
    await addLikeUseCase.execute(useCaseParams, owner);

    // Assert
    expect(mockLikeRepository.checkLikeIsExists)
      .toBeCalledWith(useCaseParams.commentId, owner);
    expect(mockLikeRepository.addLike)
      .toBeCalledWith(new AddLike({
        commentId: useCaseParams.commentId,
        owner,
      }));
  });

  it('should orchestrate the add like use case where already liking a comment', async () => {
    // Arrange
    const useCaseParams = {
      commentId: 'comment-123',
    };
    const owner = 'user-123';
    const mockCommentRepository = new CommentRepository();
    const mockLikeRepository = new LikeRepository();

    mockCommentRepository.checkCommentIsExists = jest.fn(() => Promise.resolve());
    mockCommentRepository.checkCommentIsPartOfThread = jest.fn(() => Promise.resolve());
    mockLikeRepository.checkLikeIsExists = jest.fn(() => Promise.resolve(true));
    mockLikeRepository.deleteLike = jest.fn(() => Promise.resolve());

    const addLikeUseCase = new AddLikeUseCase({
      commentRepository: mockCommentRepository,
      likeRepository: mockLikeRepository
    });

    // Action
    await addLikeUseCase.execute(useCaseParams, owner);

    // Assert
    expect(mockCommentRepository.checkCommentIsExists)
      .toBeCalledWith(useCaseParams.commentId);
    expect(mockLikeRepository.checkLikeIsExists)
      .toBeCalledWith(useCaseParams.commentId, owner);
    expect(mockLikeRepository.deleteLike)
      .toBeCalledWith(useCaseParams.commentId, owner);
  });
});
