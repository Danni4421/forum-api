class DetailReply {
  constructor(payload) {
    this._verifyPayload(payload);

    const {
      id, commentId, content, date, username
    } = payload;

    this.id = id;
    this.commentId = commentId;
    this.content = content;
    this.date = date;
    this.username = username;
  }

  _verifyPayload({
    id, commentId, content, date, username
  }) {
    if (!id || !commentId || !content || !date || !username) {
      throw new Error('DETAIL_REPLY.NOT_CONTAIN_NEEDED_PROPERTY');
    }

    if (typeof id !== 'string'
    || typeof commentId !== 'string'
    || typeof content !== 'string'
    || typeof date !== 'string'
    || typeof username !== 'string') {
      throw new Error('DETAIL_REPLY.NOT_MEET_DATA_TYPE_SPECIFICATION');
    }
  }
}

module.exports = DetailReply;
