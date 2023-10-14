const NotFoundError = require('../../Commons/exceptions/NotFoundError');
const ThreadRepository = require('../../Domains/threads/ThreadRepository');
const AddedThread = require('../../Domains/threads/entities/AddedThread');

class ThreadRepositoryPostgres extends ThreadRepository {
  constructor(pool, idGenerator, dateGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
    this._dateGenerator = dateGenerator;
  }

  async addThread({ title, body, owner }) {
    const id = `thread-${this._idGenerator(21)}`;
    const date = new this._dateGenerator().toISOString();
    const query = {
      text: 'INSERT INTO threads VALUES($1, $2, $3, $4, $5) RETURNING id, owner, title',
      values: [id, title, body, date, owner],
    };

    const result = await this._pool.query(query);
    return new AddedThread(result.rows[0]);
  }

  async verifyThreadById(id) {
    const query = {
      text: 'SELECT id FROM threads WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('tidak dapat menemukan thread');
    }
  }

  async getThreadById(id) {
    const query = {
      text: `
        SELECT 
          t.id, t.title, t.body, t.date, u.username
        FROM threads t
          INNER JOIN users u ON t.owner = u.id
          WHERE t.id = $1
      `,
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('tidak dapat menemukan thread');
    }

    return result.rows[0];
  }
}

module.exports = ThreadRepositoryPostgres;
