const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.resolve(__dirname, 'level.db'), (err) => {
  if (err) return console.error('Database error:', err.message);
  console.log('leveldb connected');
});

db.run(`
  CREATE TABLE IF NOT EXISTS users (
    userId TEXT NOT NULL,
    guildId TEXT NOT NULL,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    PRIMARY KEY (userId, guildId)
  )
`);

module.exports = db;
