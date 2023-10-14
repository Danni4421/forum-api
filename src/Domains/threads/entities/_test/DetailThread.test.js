const DetailThread = require('../DetailThread');

describe('a DetailsThread entities', () => {
  it('should throw error when given payload did not contain needed property', () => {
    // Arrange
    const payload = {
      id: 'thread-123',
      title: 'sebuah thread',
    };

    // Action and Assert
    expect(() => new DetailThread(payload)).toThrowError('DETAIL_THREAD.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when given payload did not meet data type specification', () => {
    // Arrange
    const payload = {
      id: 'thread-123',
      title: 'sebuah thread',
      body: ['what is thread?', 'there is a comment is thread?'],
      date: new Date().toISOString(),
      username: 'ajhmdni',
      comments: {
        comment: 123,
      },
    };

    // Action and Assert
    expect(() => new DetailThread(payload)).toThrowError('DETAIL_THREAD.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should create detail thread object correctly', () => {
    // Arrange
    const payload = {
      id: 'thread-123',
      title: 'sebuah thread',
      body: 'what is thread?',
      date: new Date().toISOString(),
      username: 'ajhmdni',
      comments: [
        {
          id: 'comment-123',
          username: 'johndoe',
          date: new Date().toISOString(),
          content: 'sebuah content',
        },
      ],
    };

    // Action
    const detailThread = new DetailThread(payload);

    // Assert
    expect(detailThread.id).toEqual(payload.id);
    expect(detailThread.title).toEqual(payload.title);
    expect(detailThread.body).toEqual(payload.body);
    expect(detailThread.date).toEqual(payload.date);
    expect(detailThread.username).toEqual(payload.username);
    expect(detailThread.comments).toHaveLength(1);
  });
});
