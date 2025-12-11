const express = require('express');
const axios = require('axios');
const app = express();
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

const { name, description, invite, support, pfp, feature1, feature2, feature3, feature4, discordWebhook } = require("./config.json");

const port = 8000;
app.listen(port, async () => {
  console.log(`Server is running on port ${port}`);  
const embed = {
  "embeds": [{
    "title": `🚀 Server Launched: ${name}`,
    "description": `🌐 The website for **${name}** is now live and running smoothly!`,
    "color": 0x00AEEF,
    "author": {
      "name": name,
      "url": invite,
      "icon_url": pfp
    },
    "thumbnail": {
      "url": pfp
    },
    "fields": [
      {
        "name": "📖 Description",
        "value": description,
        "inline": false
      },
      {
        "name": "🔗 Invite",
        "value": `[Click here](${invite})`,
        "inline": true
      },
      {
        "name": "🛠 Support",
        "value": `[Need help?](${support})`,
        "inline": true
      }
    ],
    "footer": {
      "text": "Powered by Toonel | Stay secure & anonymous",
      "icon_url": pfp
    },
    "timestamp": new Date().toISOString()
  }]
};

  try {
    await axios.post(discordWebhook, embed);
    console.log("Notification sent to Discord.");
  } catch (error) {
    console.error("Error sending notification to Discord:", error);
  }
});

app.use(express.static("assets"));

app.get('/', (req, res) => {
  res.render("index", { name, description, invite, support, pfp, f1: feature1, f2: feature2, f3: feature3, f4: feature4 });
});

app.get('/server', async (req, res) => {
  res.redirect(support);
});

app.get('/invite', async (req, res) => {
  res.redirect(invite);
});

app.get('/github', async (req, res) => {
  res.redirect(`https://github.com/M-thefl`);
});

app.get('/git', async (req, res) => {
  res.redirect(`https://github.com/M-thefl`);
});

app.get('/commands', (req, res) => {
  res.render('commands', {
      invite: "https://discord.com/oauth2/authorize?client_id=YOUR_BOT_ID&permissions=8&scope=bot"
  });
});



//   app.get('/bot', (req, res) => {
//     res.render('bot');
//   });