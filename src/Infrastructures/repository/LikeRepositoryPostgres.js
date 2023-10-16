const LikeRepository = require('../../Domains/likes/LikeRepository');

class LikeRepositoryPostgres extends LikeRepository {
  constructor(pool, idGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
  }

  async addLike({ commentId, owner }) {
    const id = `like-${this._idGenerator(21)}`;
    const query = {
      text: 'INSERT INTO likes VALUES($1, $2, $3)',
      values: [id, commentId, owner],
    };

    await this._pool.query(query);
  }

  async checkLikeIsExists(commentId, owner) {
    const query = {
      text: 'SELECT id FROM likes WHERE comment_id = $1 AND owner = $2',
      values: [commentId, owner],
    };

    const result = await this._pool.query(query);
    return result.rowCount > 0;
  }

  async getLikesByCommentId(commentId) {
    const query = {
      text: 'SELECT id FROM likes WHERE comment_id = $1',
      values: [commentId],
    };

    const result = await this._pool.query(query);
    return result.rows.length;
  }

  async deleteLike(commentId, owner) {
    const query = {
      text: 'DELETE FROM likes WHERE comment_id = $1 AND owner = $2',
      values: [commentId, owner],
    };

    await this._pool.query(query);
  }

  async deleteLikesByCommentId(commentId) {
    const query = {
      text: 'DELETE FROM likes WHERE comment_id = $1',
      values: [commentId],
    };

    await this._pool.query(query);
  }
}

module.exports = LikeRepositoryPostgres;
