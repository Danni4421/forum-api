const CommentRepository = require('../../../Domains/comments/CommentRepository');
const ReplyRepository = require('../../../Domains/replies/ReplyRepository');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const LikeRepository = require('../../../Domains/likes/LikeRepository');
const DeleteThreadUseCase = require('../DeleteThreadUseCase');

describe('DeleteThreadUseCase', () => {
  it('should persist delete thread use case correctly', async () => {
    // Arrange
    const threadComments = [
      {
        id: 'comment-123',
        title: 'komentar pertama',
        body: 'isi dari komentar pertama',
        date: '01-10-2023',
        owner: 'user-123'
      },
      {
        id: 'comment-234',
        title: 'komentar kedua',
        body: 'isi dari komentar kedua',
        date: '02-10-2023',
        owner: 'user-234'
      }
    ];
    const threadReplies = [
      {
        id: 'reply-123',
        content: 'balasan pertama',
        date: '01-10-2023',
        commentId: 'comment-123',
        owner: 'user-234'
      }
    ];
    const commentLikes = [
      {
        id: 'like-123',
        commentId: 'comment-123',
        owner: 'user-234',
      }
    ];
    const useCaseParams = {
      threadId: 'thread-123',
    };
    const owner = 'user-123';

    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();
    const mockReplyRepository = new ReplyRepository();
    const mockLikeRepository = new LikeRepository();

    /** mocking needed function */
    mockReplyRepository.getReplyByThreadId = jest
      .fn(() => Promise.resolve(threadReplies));
    mockCommentRepository.getCommentByThreadId = jest
      .fn(() => Promise.resolve(threadComments));
    mockLikeRepository.getLikesByCommentId = jest
      .fn((commentId) => Promise.resolve(commentLikes.filter((like) => like.commentId === commentId)));
    mockLikeRepository.deleteLikesByCommentId = jest
      .fn(() => Promise.resolve());
    mockReplyRepository.deleteReplyPermanentlyById = jest
      .fn(() => Promise.resolve());
    mockCommentRepository.deleteCommentPermanentlyById = jest
      .fn(() => Promise.resolve());
    mockThreadRepository.deleteThreadById = jest
      .fn(() => Promise.resolve());
    mockThreadRepository.verifyThreadOwner = jest
      .fn(() => Promise.resolve());
    mockThreadRepository.verifyThreadById = jest
      .fn(() => Promise.resolve());

    const deleteThreadUseCase = new DeleteThreadUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
      replyRepository: mockReplyRepository,
      likeRepository: mockLikeRepository,
    });

    // Action
    await deleteThreadUseCase.execute(useCaseParams, owner);

    // Assert
    expect(mockLikeRepository.deleteLikesByCommentId)
      .toBeCalledWith(commentLikes[0].commentId);
    threadReplies.forEach((reply) => {
      expect(mockReplyRepository.deleteReplyPermanentlyById)
        .toBeCalledWith(reply.id);
    });
    threadComments.forEach((comment) => {
      expect(mockCommentRepository.deleteCommentPermanentlyById)
        .toBeCalledWith(comment.id);
    });
    expect(mockThreadRepository.deleteThreadById)
      .toBeCalledWith(useCaseParams.threadId);
  });
});
