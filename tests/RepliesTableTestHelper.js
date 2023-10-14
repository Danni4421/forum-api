/* istanbul ignore file */
const pool = require('../src/Infrastructures/database/postgres/pool');

const RepliesTableTestHelper = {
  async addReplies({
    id, content, commentId, owner
  }) {
    const date = new Date().toISOString();
    const isDelete = false;
    const query = {
      text: 'INSERT INTO replies VALUES($1, $2, $3, $4, $5, $6) RETURNING id',
      values: [id, content, date, commentId, owner, isDelete],
    };

    const result = await pool.query(query);
    return result.rows[0].id;
  },
  async findReplies(commentId) {
    const query = {
      text: 'SELECT * FROM replies WHERE comment_id = $1 AND is_deleted = FALSE',
      values: [commentId],
    };

    const result = await pool.query(query);
    return result.rows;
  },
  async cleanTable() {
    await pool.query('TRUNCATE TABLE replies');
  },
};

module.exports = RepliesTableTestHelper;
