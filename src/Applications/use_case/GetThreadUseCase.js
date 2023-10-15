/* eslint-disable no-param-reassign */
const DetailComment = require('../../Domains/comments/entities/DetailComment');
const DetailReply = require('../../Domains/replies/entities/DetailReply');
const DetailThread = require('../../Domains/threads/entities/DetailThread');

class GetThreadUseCase {
  constructor({
    threadRepository, commentRepository, replyRepository, likeRepository
  }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
    this._replyRepository = replyRepository;
    this._likeRepository = likeRepository;
  }

  async execute(useCaseParams) {
    const { threadId } = useCaseParams;
    await this._threadRepository.verifyThreadById(threadId);

    const thread = await this._threadRepository.getThreadById(threadId);
    const comments = await this._commentRepository.getCommentByThreadId(threadId);
    const replies = await this._replyRepository.getReplyByThreadId(threadId);

    const detailThread = new DetailThread({ ...thread, comments });
    detailThread.comments = this._getCommentReplies(comments, replies);
    detailThread.comments = await this._getCommentLikeCount(detailThread.comments);

    return detailThread;
  }

  _getCommentReplies(comments, replies) {
    return comments.map((comment) => {
      const detailComment = new DetailComment({ ...comment });
      detailComment.replies = replies
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
    });
  }

  async _getCommentLikeCount(comments) {
    const commentLikes = await Promise.all(
      comments.map(async (comment) => {
        comment.likeCount = await this._likeRepository.getLikesByCommentId(comment.id);
        return comment;
      })
    );

    return commentLikes;
  }
}

module.exports = GetThreadUseCase;
