const CreateReply = require('../../Domains/replies/entities/CreateReply');

class AddReplyUseCase {
  constructor({ commentRepository, replyRepository }) {
    this._commentRepository = commentRepository;
    this._replyRepository = replyRepository;
  }

  async execute(useCasePayload, useCaseParams, owner) {
    const { threadId, commentId } = useCaseParams;
    const { content } = useCasePayload;
    await this._commentRepository.checkCommentIsExists(commentId);
    await this._commentRepository.checkCommentIsPartOfThread(threadId, commentId);
    const createReply = new CreateReply({
      commentId, content, owner,
    });
    return this._replyRepository.addReply(createReply);
  }
}

module.exports = AddReplyUseCase;
