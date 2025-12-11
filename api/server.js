const express = require('express');
const shortid = require('shortid');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

dotenv.config();
  
const app = express();
const db = new sqlite3.Database('./urlShortener.db');
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

// const JWT_SECRET = process.env.JWT_SECRET || 'Boobs-is-my-love ';

const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'URL Shortener API',
            version: '1.0.0',
            description: 'A professional URL shortening API with SQLite and JWT authentication',
        },
    },
    apis: ['./server.js'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.post('/shorten', authenticateToken, (req, res) => {
    const { longUrl } = req.body;

    if (!longUrl) {
        return res.status(400).json({ message: 'URL is required' });
    }

    const shortUrl = shortid.generate();
    const query = `INSERT INTO urls (longUrl, shortUrl) VALUES (?, ?)`;

    db.run(query, [longUrl, shortUrl], function (err) {
        if (err) {
            return res.status(500).json({ message: 'Failed to shorten URL' });
        }

        res.json({ shortUrl: `http://localhost:${PORT}/${shortUrl}` });
    });
});

function authenticateToken(req, res, next) {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(401).json({ message: 'Access denied' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }

        req.user = user;
        next();
    });
}

app.get('/:shortUrl', (req, res) => {
    const { shortUrl } = req.params;
    const query = `SELECT * FROM urls WHERE shortUrl = ?`;

    db.get(query, [shortUrl], (err, row) => {
        if (err || !row) {
            return res.status(404).json({ message: 'Short URL not found' });
        }

        const { longUrl } = row;
        db.run('UPDATE urls SET clickCount = clickCount + 1 WHERE shortUrl = ?', [shortUrl]);

        res.redirect(longUrl);
    });
});

app.post('/register', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const query = `INSERT INTO users (username, password) VALUES (?, ?)`;

    db.run(query, [username, hashedPassword], function (err) {
        if (err) {
            return res.status(500).json({ message: 'User registration failed' });
        }

        res.json({ message: 'User registered successfully' });
    });
});


app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    const query = `SELECT * FROM users WHERE username = ?`;

    db.get(query, [username], (err, row) => {
        if (err || !row || !bcrypt.compareSync(password, row.password)) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: row.id, username: row.username }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});