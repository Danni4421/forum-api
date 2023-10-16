const autoBind = require('auto-bind');
const AddThreadUseCase = require('../../../../Applications/use_case/AddThreadUseCase');
const GetThreadUseCase = require('../../../../Applications/use_case/GetThreadUseCase');
const DeleteThreadUseCase = require('../../../../Applications/use_case/DeleteThreadUseCase');

class ThreadsHandler {
  constructor(container) {
    this._container = container;

    autoBind(this);
  }

  async postThreadHandler(request, h) {
    const addThreadUseCase = this._container.getInstance(AddThreadUseCase.name);
    const { id: owner } = request.auth.credentials;
    const addedThread = await addThreadUseCase.execute(request.payload, owner);

    const response = h.response({
      status: 'success',
      message: 'Berhasil membuat thread',
      data: {
        addedThread,
      },
    });
    response.code(201);
    return response;
  }

  async getThreadByIdHandler(request) {
    const getThreadUseCase = this._container.getInstance(GetThreadUseCase.name);
    const thread = await getThreadUseCase.execute(request.params);

    return {
      status: 'success',
      data: {
        thread,
      },
    };
  }

  async deleteThreadByIdHandler(request) {
    const { id: owner } = request.auth.credentials;
    const deleteThreadUseCase = this._container.getInstance(DeleteThreadUseCase.name);
    await deleteThreadUseCase.execute(request.params, owner);

    return {
      status: 'success',
      message: 'Berhasil menghapus thread',
    };
  }
}

module.exports = ThreadsHandler;
