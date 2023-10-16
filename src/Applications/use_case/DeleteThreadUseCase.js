class DeleteThreadUseCase {
  constructor({
    threadRepository, commentRepository, replyRepository, likeRepository
  }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
    this._replyRepository = replyRepository;
    this._likeRepository = likeRepository;
  }

  async execute(useCaseParams, owner) {
    const { threadId } = useCaseParams;
    await this._threadRepository.verifyThreadById(threadId);
    await this._threadRepository.verifyThreadOwner(threadId, owner);
    const replies = await this._replyRepository.getReplyByThreadId(threadId);
    const comments = await this._commentRepository.getCommentByThreadId(threadId);

    await this._deleteAllReplies(replies);
    await this._deleteAllCommentsAndLikes(comments);
    await this._threadRepository.deleteThreadById(threadId);
  }

  async _deleteAllReplies(replies) {
    replies.forEach(async (reply) => {
      await this._replyRepository.deleteReplyPermanentlyById(reply.id);
    });
  }

  async _deleteAllCommentsAndLikes(comments) {
    comments.forEach(async (comment) => {
      await this._commentRepository.deleteCommentPermanentlyById(comment.id);
      await this._likeRepository.deleteLikesByCommentId(comment.id);
    });
  }
}

module.exports = DeleteThreadUseCase;
