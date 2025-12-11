const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./users.db");

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS user_usage (
        user_id TEXT,
        guild_id TEXT,
        PRIMARY KEY (user_id, guild_id)
    )`);
});

const hasUsedCommand = (userId, guildId) => {
    return new Promise((resolve, reject) => {
        db.get(
            "SELECT * FROM user_usage WHERE user_id = ? AND guild_id = ?",
            [userId, guildId],
            (err, row) => {
                if (err) {
                    console.error("Database error (hasUsedCommand):", err);
                    return reject(err);
                }
                resolve(!!row);
            }
        );
    });
};



const logCommandUsage = (userId, guildId) => {
    return new Promise((resolve, reject) => {
        db.get(
            "SELECT * FROM user_usage WHERE user_id = ? AND guild_id = ?",
            [userId, guildId],
            (err, row) => {
                if (err) {
                    console.error("Database error (logCommandUsage - check existence):", err);
                    return reject(err);
                }

                if (row) {
                    return resolve();
                }
                db.run(
                    "INSERT INTO user_usage (user_id, guild_id) VALUES (?, ?)",
                    [userId, guildId],
                    (insertErr) => {
                        if (insertErr) {
                            console.error("Database error (logCommandUsage - insert):", insertErr);
                            return reject(insertErr);
                        }
                        resolve();
                    }
                );
            }
        );
    });
};

module.exports = { hasUsedCommand, logCommandUsage };
