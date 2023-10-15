const CommentRepository = require('../../../Domains/comments/CommentRepository');
const ReplyRepository = require('../../../Domains/replies/ReplyRepository');
const AddReplyUseCase = require('../AddReplyUseCase');
const AddedReply = require('../../../Domains/replies/entities/AddedReply');
const CreateReply = require('../../../Domains/replies/entities/CreateReply');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');

describe('AddReplyUseCase', () => {
  it('should throw error when comment is not exists', async () => {
    // Arrange
    const replyUseCasePayload = {
      content: 'sebuah balasan',
    };
    const replyUseCaseParams = {
      threadId: 'thread-123',
      commentId: 'invalidCommentId',
    };

    const mockCommentRepository = new CommentRepository();
    const mockReplyRepository = new ReplyRepository();

    mockCommentRepository.checkCommentIsExists = jest
      .fn(() => Promise.reject(new NotFoundError()));
    mockReplyRepository.addReply = jest
      .fn(() => Promise.resolve());

    const addReplyUseCase = new AddReplyUseCase({
      commentRepository: mockCommentRepository,
      replyRepository: mockReplyRepository
    });

    // Action and Assert
    await expect(addReplyUseCase.execute(replyUseCasePayload, replyUseCaseParams, 'user-123'))
      .rejects.toThrow(NotFoundError);
  });

  it('should throw error when comment is not part of thread', async () => {
    // Arrange
    const replyUseCasePayload = {
      content: 'sebuah balasan',
    };
    const replyUseCaseParams = {
      threadId: 'thread-123',
      commentId: 'comment-123',
    };

    const mockCommentRepository = new CommentRepository();
    const mockReplyRepository = new ReplyRepository();

    mockCommentRepository.checkCommentIsExists = jest
      .fn(() => Promise.resolve());
    mockCommentRepository.checkCommentIsPartOfThread = jest
      .fn(() => Promise.reject(new NotFoundError()));
    mockReplyRepository.addReply = jest
      .fn(() => Promise.resolve());

    const addReplyUseCase = new AddReplyUseCase({
      commentRepository: mockCommentRepository,
      replyRepository: mockReplyRepository,
    });

    // Action and Assert
    await expect(addReplyUseCase.execute(replyUseCasePayload, replyUseCaseParams, 'user-123'))
      .rejects.toThrow(NotFoundError);
  });

  it('should orchestrating the add reply use case correctly', async () => {
    // Arrange
    const replyUseCasePayload = {
      content: 'sebuah balasan',
    };
    const replyUseCaseParams = {
      threadId: 'thread-123',
      commentId: 'comment-123'
    };
    const expectedAddedReply = new AddedReply({
      id: 'reply-123',
      content: replyUseCasePayload.content,
      owner: 'user-123'
    });
    const mockCommentRepository = new CommentRepository();
    const mockReplyRepository = new ReplyRepository();

    mockCommentRepository.checkCommentIsExists = jest
      .fn(() => Promise.resolve());
    mockCommentRepository.checkCommentIsPartOfThread = jest
      .fn(() => Promise.resolve());
    mockReplyRepository.addReply = jest
      .fn(() => new AddedReply({
        id: 'reply-123',
        content: 'sebuah balasan',
        owner: 'user-123',
      }));

    const addReplyUseCase = new AddReplyUseCase({
      commentRepository: mockCommentRepository,
      replyRepository: mockReplyRepository
    });

    // Action
    const addedReply = await addReplyUseCase.execute(
      replyUseCasePayload,
      replyUseCaseParams,
      'user-123'
    );

    // Assert
    expect(addedReply).toStrictEqual(expectedAddedReply);
    expect(mockCommentRepository.checkCommentIsExists).toBeCalledWith(replyUseCaseParams.commentId);
    expect(mockCommentRepository.checkCommentIsPartOfThread)
      .toBeCalledWith(replyUseCaseParams.threadId, replyUseCaseParams.commentId);
    expect(mockReplyRepository.addReply).toBeCalledWith(
      new CreateReply({
        commentId: replyUseCaseParams.commentId,
        content: replyUseCasePayload.content,
        owner: 'user-123',
      }),
    );
  });
});
