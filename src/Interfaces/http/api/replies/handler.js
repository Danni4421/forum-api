const autoBind = require('auto-bind');
const AddReplyUseCase = require('../../../../Applications/use_case/AddReplyUseCase');
const DeleteReplyUseCase = require('../../../../Applications/use_case/DeleteReplyUseCase');

class RepliesHanlder {
  constructor(container) {
    this._container = container;

    autoBind(this);
  }

  async postReplyHandler(request, h) {
    const addReplyUseCase = this._container.getInstance(AddReplyUseCase.name);
    const { id: owner } = request.auth.credentials;
    const addedReply = await addReplyUseCase.execute(
      request.payload,
      request.params,
      owner,
    );

    const response = h.response({
      status: 'success',
      data: {
        addedReply,
      }
    });
    response.code(201);
    return response;
  }

  async deleteReplyByIdHandler(request) {
    const deleteReplyUseCase = this._container.getInstance(DeleteReplyUseCase.name);
    const { id: owner } = request.auth.credentials;
    await deleteReplyUseCase.execute(request.params, owner);

    return {
      status: 'success',
      message: 'Berhasil menghapus balasan'
    };
  }
}

module.exports = RepliesHanlder;
