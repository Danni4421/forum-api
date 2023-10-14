const CreateComment = require('../../Domains/comments/entities/CreateComment');

class AddCommentUseCase {
  constructor({ commentRepository, threadRepository }) {
    this._commentRepository = commentRepository;
    this._threadRepository = threadRepository;
  }

  async execute(useCasePayload, useCaseParams, owner) {
    const { threadId } = useCaseParams;
    await this._threadRepository.verifyThreadById(threadId);
    const { content } = useCasePayload;
    const createComment = new CreateComment({
      content,
      threadId,
      owner,
    });
    return this._commentRepository.addComment(createComment);
  }
}

module.exports = AddCommentUseCase;
