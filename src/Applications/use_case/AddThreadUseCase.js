const CreateThread = require('../../Domains/threads/entities/CreateThread');

class AddThreadUseCase {
  constructor({ threadRepository }) {
    this._threadRepository = threadRepository;
  }

  async execute(useCasePayload, owner) {
    const { title, body } = useCasePayload;
    const createThread = new CreateThread({ title, body, owner });
    return this._threadRepository.addThread(createThread);
  }
}

module.exports = AddThreadUseCase;
