/* eslint-disable no-param-reassign */
const GetThreadUseCase = require('../GetThreadUseCase');
const CommentRepository = require('../../../Domains/comments/CommentRepository');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const ReplyRepository = require('../../../Domains/replies/ReplyRepository');
const RegisteredUser = require('../../../Domains/users/entities/RegisteredUser');
const AddedThread = require('../../../Domains/threads/entities/AddedThread');
const DetailThread = require('../../../Domains/threads/entities/DetailThread');
const DetailComment = require('../../../Domains/comments/entities/DetailComment');
const DetailReply = require('../../../Domains/replies/entities/DetailReply');

describe('GetThreadUseCase', () => {
  it('should orchestrating the get thread function', async () => {
    // Arrange
    const registeredUser = new RegisteredUser({
      id: 'user-123',
      username: 'ajhmdni',
      fullname: 'Aji Hamdani Ahmad',
    });
    const addedThread = new AddedThread({
      id: 'thread-123',
      title: 'new thread',
      owner: registeredUser.id,
    });
    const useCaseThreadPayload = {
      id: addedThread.id,
      title: addedThread.title,
      body: 'sebuah body thread',
      date: '2021-08-08T07:19:09.775Z',
      username: registeredUser.username,
    };
    const useCaseCommentPayload = [
      {
        id: 'comment-123',
        username: registeredUser.username,
        date: '2021-08-08T07:19:09.775Z',
        content: 'komentar pertama',
        replies: [],
        isDeleted: false,
      },
      {
        id: 'comment-234',
        username: 'johndoe',
        date: '2021-08-08T07:19:09.775Z',
        content: 'komentar kedua',
        replies: [],
        isDeleted: true,
      },
    ];
    const useCaseParams = {
      threadId: 'thread-123',
      commentId: 'comment-123',
    };
    const useCaseReplyPayload = [
      {
        id: 'reply-123',
        commentId: 'comment-123',
        content: 'sebuah balasan',
        date: '2021-08-08T07:19:09.775Z',
        username: 'johndoe',
        isDeleted: false,
      },
      {
        id: 'reply-234',
        commentId: 'comment-123',
        content: 'balasan kedua',
        date: '2021-08-08T07:19:09.775Z',
        username: 'ajhmdni',
        isDeleted: true,
      },
    ];

    const expectedDetailThread = new DetailThread({
      ...useCaseThreadPayload,
      comments: useCaseCommentPayload.map((comment) => {
        const detailComment = new DetailComment({ ...comment });
        detailComment.replies = useCaseReplyPayload
          .filter((reply) => reply.commentId === comment.id && !comment.isDeleted)
          .map((reply) => {
            const detailReply = new DetailReply({ ...reply });
            if (reply.isDeleted) detailReply.content = '**balasan telah dihapus**';
            return detailReply;
          });
        if (comment.isDeleted) {
          detailComment.content = '**komentar telah dihapus**';
          detailComment.replies = [];
        }
        return detailComment;
      }),
    });
    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();
    const mockReplyRepository = new ReplyRepository();

    /** mocking needed function */
    mockThreadRepository.verifyThreadById = jest.fn(() => Promise.resolve());
    mockThreadRepository.getThreadById = jest.fn(() => Promise.resolve(useCaseThreadPayload));
    mockCommentRepository.getCommentByThreadId = jest.fn(() => Promise.resolve(
      useCaseCommentPayload.map((comment) => ({ ...comment }))
    ));
    mockReplyRepository.getReplyByThreadId = jest.fn(() => Promise.resolve(
      useCaseReplyPayload.map((reply) => ({ ...reply }))
    ));

    const getThreadUseCase = new GetThreadUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
      replyRepository: mockReplyRepository,
    });

    // Action
    const thread = await getThreadUseCase.execute(useCaseParams);

    // Assert
    const { comments: [comment1, comment2] } = thread;
    expect(thread).toStrictEqual(expectedDetailThread);
    expect(thread.comments).toHaveLength(2);
    expect(comment1.replies).toHaveLength(2);
    expect(comment2.replies).toHaveLength(0);
    expect(mockThreadRepository.verifyThreadById)
      .toBeCalledWith(useCaseParams.threadId);
    expect(mockThreadRepository.getThreadById)
      .toBeCalledWith(useCaseParams.threadId);
    expect(mockCommentRepository.getCommentByThreadId)
      .toBeCalledWith(useCaseParams.threadId);
    expect(mockReplyRepository.getReplyByThreadId)
      .toBeCalledWith(useCaseParams.threadId);
  });
});
