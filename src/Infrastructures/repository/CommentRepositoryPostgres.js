// const NotFoundError = require('../../Commons/exceptions/NotFoundError');
const AuthorizationError = require('../../Commons/exceptions/AuthorizationError');
const NotFoundError = require('../../Commons/exceptions/NotFoundError');
const CommentRepository = require('../../Domains/comments/CommentRepository');
const AddedComment = require('../../Domains/comments/entities/AddedComment');

class CommentRepositoryPostgres extends CommentRepository {
  constructor(pool, idGenerator, dateGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
    this._dateGenerator = dateGenerator;
  }

  async addComment({ content, threadId, owner }) {
    const id = `comment-${this._idGenerator(21)}`;
    const date = new this._dateGenerator().toISOString();
    const isDelete = false;
    const query = {
      text: 'INSERT INTO comments VALUES($1, $2, $3, $4, $5, $6) RETURNING id, content, owner',
      values: [id, date, content, threadId, owner, isDelete],
    };

    const result = await this._pool.query(query);
    return new AddedComment(result.rows[0]);
  }

  async checkCommentIsExists(commentId) {
    const query = {
      text: 'SELECT id FROM comments WHERE id = $1',
      values: [commentId]
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('komentar tidak dapat ditemukan');
    }
  }

  async checkCommentIsPartOfThread(threadId, commentId) {
    const query = {
      text: 'SELECT id FROM comments WHERE id = $1 AND thread_id = $2',
      values: [commentId, threadId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('komentar bukan termasuk ke dalam thread');
    }
  }

  async getCommentByThreadId(threadId) {
    const query = {
      text: `
        SELECT 
          c.id, u.username, c.date, c.content, c.is_deleted
        FROM comments c
          INNER JOIN users u ON u.id = c.owner
          WHERE c.thread_id = $1
          ORDER BY c.date
      `,
      values: [threadId]
    };

    const result = await this._pool.query(query);

    return result.rowCount > 0
      ? result.rows.map((comment) => ({ ...comment, isDeleted: comment.is_deleted }))
      : [];
  }

  async verifyCommentOwner(commentId, owner) {
    const query = {
      text: `
        SELECT id
        FROM comments
        WHERE id = $1 AND owner = $2
      `,
      values: [commentId, owner],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new AuthorizationError('anda bukan pemilik komentar');
    }
  }

  async deleteCommentById(commentId) {
    const query = {
      text: 'UPDATE comments SET is_deleted = TRUE WHERE id = $1 RETURNING id',
      values: [commentId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('gagal menghapus komentar, id tidak ditemukan');
    }
  }

  async deleteCommentPermanentlyById(commentId) {
    const query = {
      text: 'DELETE FROM comments WHERE id = $1',
      values: [commentId],
    };

    await this._pool.query(query);
  }
}

module.exports = CommentRepositoryPostgres;
