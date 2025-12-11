const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/features', (req, res) => {
    const features = {
        moderation: [
            {
                id: 1,
                icon: 'shield-alt',
                title: 'Advanced Auto-Mod',
                description: 'AI-powered moderation with custom filters',
                premium: true
            },
            {
                id: 2,
                icon: 'user-check',
                title: 'Join/Leave Logs',
                description: 'Track member joins and leaves',
                premium: false
            }
        ],
        music: [
            {
                id: 1,
                icon: 'headphones',
                title: 'High Quality Music',
                description: 'Stream with premium sound quality',
                premium: false
            },
            {
                id: 2,
                icon: 'play-circle',
                title: 'Custom Playlists',
                description: 'Save your favorite songs into playlists',
                premium: true
            }
        ],
        utility: [
            {
                id: 1,
                icon: 'cogs',
                title: 'Server Insights',
                description: 'Analytics and reports about your server',
                premium: true
            },
            {
                id: 2,
                icon: 'clock',
                title: 'Reminders',
                description: 'Set personal or server-wide reminders',
                premium: false
            }
        ],
        fun: [
            {
                id: 1,
                icon: 'gamepad',
                title: 'Mini-Games',
                description: 'Play games like trivia or tictactoe',
                premium: false
            },
            {
                id: 2,
                icon: 'laugh-beam',
                title: 'Daily Jokes',
                description: 'Get a new joke every day',
                premium: false
            }
        ]
    };

    res.status(200).json(features);
});

app.get('/api/stats', (req, res) => {
    res.status(200).json({
        servers: 12543,
        commands: 187,
        uptime: 99.98,
        users: 4500000
    });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Toonel website running at http://localhost:${port}`);
});