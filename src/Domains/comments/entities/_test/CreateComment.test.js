const CreateComment = require('../CreateComment');

describe('a CreateComment entities', () => {
  it('should throw error when payload did not contain needed property', () => {
    // Arrange
    const payload = {
      content: 'isi sebuah comment',
      threadId: 'thread-h-qweoJoiJOijqlwke',
    };

    // Action and Assert
    expect(() => new CreateComment(payload)).toThrowError('CREATE_COMMENT.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload property did not meet data type specification', () => {
    // Arrange
    const payload = {
      content: ['first content', 'second content', 'third content'],
      threadId: 'thread-h-qweoJoiJOijqlwke',
      owner: true,
    };

    // Action and Assert
    expect(() => new CreateComment(payload)).toThrowError('CREATE_COMMENT.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should create CreateComment object correctly', () => {
    // Arrange
    const payload = {
      content: 'isi sebuah comment',
      threadId: 'thread-h-qweoJoiJOijqlwke',
      owner: 'user-ioj213oAIjoiasdksd',
    };

    // Action
    const { content, threadId, owner } = new CreateComment(payload);

    // Assert
    expect(content).toEqual(payload.content);
    expect(threadId).toEqual(payload.threadId);
    expect(owner).toEqual(payload.owner);
  });
});
