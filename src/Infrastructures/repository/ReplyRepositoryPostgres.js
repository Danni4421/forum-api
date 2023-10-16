const ReplyRepository = require('../../Domains/replies/ReplyRepository');
const NotFoundError = require('../../Commons/exceptions/NotFoundError');
const AddedReply = require('../../Domains/replies/entities/AddedReply');
const AuthorizationError = require('../../Commons/exceptions/AuthorizationError');

class ReplyRepositoryPostgres extends ReplyRepository {
  constructor(pool, idGenerator, dateGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
    this._dateGenerator = dateGenerator;
  }

  async addReply({ commentId, content, owner }) {
    const id = `reply-${this._idGenerator(21)}`;
    const date = new this._dateGenerator().toISOString();
    const isDelete = false;
    const query = {
      text: 'INSERT INTO replies VALUES($1, $2, $3, $4, $5, $6) RETURNING id, content, owner',
      values: [id, content, date, commentId, owner, isDelete],
    };

    const result = await this._pool.query(query);
    return new AddedReply(result.rows[0]);
  }

  async deleteReplyById(replyId) {
    const query = {
      text: 'UPDATE replies SET is_deleted = TRUE WHERE id = $1 RETURNING id',
      values: [replyId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('gagal menghapus balasan, id tidak ditemukan');
    }
  }

  async deleteReplyPermanentlyById(replyId) {
    const query = {
      text: 'DELETE FROM replies WHERE id = $1',
      values: [replyId],
    };

    await this._pool.query(query);
  }

  async getReplyByThreadId(threadId) {
    const query = {
      text: `
      SELECT 
        r.id, c.id AS comment_id, r.content, r.date, u.username, r.is_deleted
      FROM replies r 
        INNER JOIN users u ON u.id = r.owner 
        INNER JOIN comments c ON c.id = r.comment_id
        INNER JOIN threads t ON t.id = c.thread_id
        WHERE t.id = $1
        ORDER BY r.date ASC
        `,
      values: [threadId],
    };

    const result = await this._pool.query(query);
    return result.rows.map((reply) => ({
      ...reply,
      commentId: reply.comment_id,
      isDeleted: reply.is_deleted,
    }));
  }

  async verifyReplyOwner(replyId, owner) {
    const query = {
      text: 'SELECT owner FROM replies WHERE id = $1 AND owner = $2',
      values: [replyId, owner],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new AuthorizationError('verifikasi gagal, anda bukan pemilik balasan');
    }
  }

  async checkReplyIsExists(replyId) {
    const query = {
      text: 'SELECT id FROM replies WHERE id = $1',
      values: [replyId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('gagal mendapatkan balasan, id tidak ditemukan');
    }
  }
}

module.exports = ReplyRepositoryPostgres;
