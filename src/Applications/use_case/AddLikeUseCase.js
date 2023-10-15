const AddLike = require('../../Domains/likes/entities/AddLike');

class AddLikeUseCase {
  constructor({ commentRepository, likeRepository }) {
    this._commentRepository = commentRepository;
    this._likeRepository = likeRepository;
  }

  async execute(useCaseParams, owner) {
    const { threadId, commentId } = useCaseParams;
    await this._commentRepository.checkCommentIsExists(commentId);
    await this._commentRepository.checkCommentIsPartOfThread(threadId, commentId);
    if (!(await this._likeRepository.checkLikeIsExists(commentId, owner))) {
      await this._likeRepository.addLike(
        new AddLike({
          ...useCaseParams,
          owner,
        })
      );
    } else {
      await this._likeRepository.deleteLike(commentId, owner);
    }
  }
}

module.exports = AddLikeUseCase;
