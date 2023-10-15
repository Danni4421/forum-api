const AddLike = require('../AddLike');

describe('a AddLike entities', () => {
  it('should throw error when given payload did not contain needed property', () => {
    // Arrange
    const payload = {};

    // Action and Arrange
    expect(() => new AddLike(payload)).toThrowError('ADD_LIKE.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when given payload did not meet data type specification', () => {
    // Arrange
    const payload = {
      commentId: ['comment-123', 'comment-234'],
      owner: true,
    };

    // Action and Assert
    expect(() => new AddLike(payload)).toThrowError('ADD_LIKE.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should create add like object correctly', () => {
    // Arrange
    const payload = {
      commentId: 'comment-123',
      owner: 'user-123',
    };

    // Action
    const { commentId, owner } = new AddLike(payload);

    // Assert
    expect(commentId).toEqual(payload.commentId);
    expect(owner).toEqual(payload.owner);
  });
});
