const DetailReply = require('../DetailReply');

describe('a DetailReply entities', () => {
  it('should throw error when not given needed property', () => {
    // Arrange
    const payload = {};

    // Action and Assert
    expect(() => new DetailReply(payload)).toThrowError('DETAIL_REPLY.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when not meet data type specification', () => {
    // Arrange
    const payload = {
      id: 'reply-123',
      commentId: 123,
      content: ['reply 1', 'reply 2'],
      date: true,
      username: { id: 'user-123' },
    };

    // Action and Assert
    expect(() => new DetailReply(payload)).toThrowError('DETAIL_REPLY.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should create detail reply object correctly', () => {
    // Arrange
    const payload = {
      id: 'reply-123',
      commentId: 'comment-123',
      content: 'sebuah balasan',
      date: '01-10-2023',
      username: 'ajhmdni',
    };

    // Action
    const {
      id, commentId, content, date, username
    } = new DetailReply(payload);

    // Assert
    expect(id).toEqual(payload.id);
    expect(commentId).toEqual(payload.commentId);
    expect(content).toEqual(payload.content);
    expect(date).toEqual(payload.date);
    expect(username).toEqual(payload.username);
  });
});
