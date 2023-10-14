const CreateReply = require('../CreateReply');

describe('a CreateReply entities', () => {
  it('should throw error when not given needed property', () => {
    // Arrange
    const payload = {};

    // Action and Assert
    expect(() => new CreateReply(payload)).toThrowError('CREATE_REPLY.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when given payload did not meet data type specification', () => {
    // Arrange
    const payload = {
      commentId: { id: 'comment-123' },
      content: ['first reply', 'second reply', true],
      owner: true,
    };

    // Action and Assert
    expect(() => new CreateReply(payload)).toThrowError('CREATE_REPLY.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should create replies object correctly', () => {
    // Arrange
    const payload = {
      commentId: 'comment-123',
      content: 'reply to your comment',
      owner: 'user-123',
    };

    // Action
    const { commentId, content, owner } = new CreateReply(payload);

    // Assert
    expect(commentId).toEqual(payload.commentId);
    expect(content).toEqual(payload.content);
    expect(owner).toEqual(payload.owner);
  });
});
