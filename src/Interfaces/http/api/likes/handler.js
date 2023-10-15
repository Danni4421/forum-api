const autoBind = require('auto-bind');
const AddLikeUseCase = require('../../../../Applications/use_case/AddLikeUseCase');

class LikesHandler {
  constructor(container) {
    this._container = container;

    autoBind(this);
  }

  async putLikeHandler(request) {
    const addLikeUseCase = this._container.getInstance(AddLikeUseCase.name);
    const { id: owner } = request.auth.credentials;
    await addLikeUseCase.execute(request.params, owner);

    return {
      status: 'success',
    };
  }
}

module.exports = LikesHandler;
