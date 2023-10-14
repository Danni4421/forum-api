const DetailComment = require('../DetailComment');

describe('a DetailComment entities', () => {
  it('should throw error when not given needed property', () => {
    // Arrange
    const payload = {
      id: 'comment-123',
      username: 'username',
      content: 'comment content'
    };

    // Action and Assert
    expect(() => new DetailComment(payload)).toThrowError('DETAIL_COMMENT.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload not meet data type specification', () => {
    // Arrange
    const payload = {
      id: 'comment-123',
      username: true,
      date: {},
      content: ['this is first comment', 'this is second comment'],
    };

    // Action and Assert
    expect(() => new DetailComment(payload)).toThrowError('DETAIL_COMMENT.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should create detail comment object correctly', () => {
    // Arrange
    const payload = {
      id: 'comment-123',
      username: 'ajhmdni',
      date: new Date().toISOString(),
      content: 'isi sebuah comment',
    };

    // Action
    const {
      id, username, date, content
    } = new DetailComment(payload);

    // Assert
    expect(id).toEqual(payload.id);
    expect(username).toEqual(payload.username);
    expect(date).toEqual(payload.date);
    expect(content).toEqual(payload.content);
  });
});
