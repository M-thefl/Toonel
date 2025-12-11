const { Client, GatewayIntentBits, SlashCommandBuilder,WebhookClient, Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require("discord.js");
const MarzbanAPI = require("@maniwrld/marzjs");
const fs = require('fs');
const path = require('path');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const guildEvents = require("./events/guildEvents");
const os = require('os');
const moment = require('moment');
const url = require('url');
const net = require('net');
const axios = require('axios');
const { chromium } = require('playwright');
require('dotenv').config();
require('moment-duration-format');
const { hasUsedCommand, logCommandUsage } = require("./db.js");
const ipInfoToken = 'c86c3dc9a8e1ab';



const marzban = MarzbanAPI({
  domain: "r.",
    port: 2096,
  username: "",
  password: "@",
  ssl: true,
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,

  ],
});
guildEvents(client);
let commandCount = 0;

const incrementCommandCount = () => {
  commandCount++;
};

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;

const commands = [

  ///////////////////////////    check host ///////////////////////////////////

  new SlashCommandBuilder()
    .setName('ipinfo')
    .setDescription('دریافت اطلاعات مربوط به IP یا URL')
    .addStringOption(option =>
      option.setName('ip_or_url')
        .setDescription('IP یا URL را وارد کنید')
        .setRequired(true)),


  new SlashCommandBuilder()
  .setName('setupautorole')
  .setDescription('🛠️ Set up auto roles for new members and choose a log channel.')
  .addRoleOption(option =>
    option.setName('role')
      .setDescription('The role to assign automatically.')
      .setRequired(true)
  )
  .addChannelOption(option =>
    option.setName('logchannel')
      .setDescription('The channel to log auto role assignments.')
      .setRequired(true)
  ),
new SlashCommandBuilder()
  .setName('resetautorole')
  .setDescription('♻️ Reset the auto role configuration and log channel.'),


  new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Shows detailed information about the user')
    .addUserOption(option => option.setName('user').setDescription('The user to get information about').setRequired(false)),


    
  ///////////////////////////    User Management ///////////////////////////////////
  //createconfig
  new SlashCommandBuilder()
    .setName("createconfig")
    .setDescription("Generates a new VPN config for a user.")
    .addStringOption((option) =>
      option.setName("username")
        .setDescription("Enter the username for the config")
        .setRequired(true)
    ),


  new SlashCommandBuilder()
    .setName('botinfo')
    .setDescription('Displays detailed bot information, system stats, and command usage.'),
  ///////////////////////////    help ///////////////////////////////

  //`/help`
  new SlashCommandBuilder()
    .setName("help")
    .setDescription("📜 نمایش لیست کامل کامندهای بات"),

]
  .map(command => command.toJSON());

const rest = new REST({ version: '9' }).setToken(token);

client.once("ready", async () => {
  console.log(`✅ | ${client.user.tag} is now online! 🚀`);

  const channelId = "1352672714757902409";

  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel) return console.log("⚠️ | Channel not found!");

    await channel.sendTyping();
    await new Promise(resolve => setTimeout(resolve, 2000));

    const embed = new EmbedBuilder()
      .setColor("#2ECC71")
      .setTitle("✅ Bot is Now Online!")
      .setDescription(
        "Hello everyone! 🤖 The bot is now up and running.\n\n🔹 **Status:** Fully Operational\n🔹 **Latency:** `" +
        client.ws.ping +
        "ms`\n🔹 **Prefix:** `/`\n\nType `/help` to get started! 🚀"
      )
      .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
      .setFooter({
        text: `Last reboot: ${new Date().toLocaleString()}`,
        iconURL: client.user.displayAvatarURL(),
      })
      .setTimestamp();

    await channel.send({ embeds: [embed] });
  } catch (error) {
    console.error("❌ | Error fetching the channel:", error);
  }
  // try {
  // const commands = await client.application.commands.fetch();
  // commands.forEach(async (command) => {
  //   await command.delete();
  // });
  // console.log('commands have been deleted.');
  // } catch (error) {
  // console.error('Error deleting commands:', error);
  // }
  try {
    console.log('Registering commands...');
    await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands },
    );
    console.log('registered!');
  } catch (error) {
    console.error('Error commands:', error);
  }

  client.user.setPresence({
    status: 'online',
    activities: [{ name: '/help', type: 0 }],
  });
});




client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  incrementCommandCount(); // count every command usage

  const { commandName } = interaction;
  const { hasUsedCommand, logCommandUsage } = require("./db.js");

  if (commandName === "createconfig") {
    await interaction.deferReply({ ephemeral: true });

    const userId = interaction.user.id;
    const guildId = interaction.guild.id;

    if (await hasUsedCommand(userId, guildId)) {
      return await interaction.editReply({
        content: "🚫 شما قبلاً از این کامند در این سرور استفاده کرده‌اید! برای استفاده دوباره، باید بات را به یک سرور دیگر اضافه کنید.",
        ephemeral: true
      });
    }

    await logCommandUsage(userId, guildId);

    const username = interaction.options.getString("username");
    const dataLimit = 1024 * 1024 * 1024;

    const userData = {
      status: "active",
      username: username,
      note: "Created using Discord Bot",
      proxies: { vless: {} },
      data_limit: dataLimit,
      data_limit_reset_strategy: "no_reset",
      inbounds: { vless: ["Vless"] },
    };

    try {
      await marzban.user.addUser(userData);
      const userInfo = await marzban.user.getUser(username);

      if (Array.isArray(userInfo?.links) && userInfo.links.length > 0) {
        const configLinks = userInfo.links
          .map((link, index) => `**Config ${index + 1}:**\n\`\`\`${link}\`\`\``)
          .join("\n");
          db.prepare(`
            INSERT INTO configs (user_id, username, size, created_at, config_links)
            VALUES (?, ?, ?, ?, ?)
          `).run(
            interaction.user.id,
            username,
            sizeInGB,
            new Date().toISOString(),
            configLinks
          );

        const embed = new EmbedBuilder()
          .setColor("#0099ff")
          .setTitle("🌐 VPN Configuration")
          .setDescription(`✅ **Username:** \`${username}\`\n📦 **Data Limit:** 1 GB\n\n${configLinks}`)
          .setFooter({ text: "Created using Discord Bot", iconURL: client.user.displayAvatarURL() })
          .setTimestamp();

        await interaction.editReply({ embeds: [embed], ephemeral: true });

        const logChannel = client.channels.cache.get("1347913712475832391");
        if (logChannel?.isTextBased()) {
          const logEmbed = new EmbedBuilder()
            .setColor("#ffcc00")
            .setTitle("📌 New VPN Config Created")
            .setDescription(`🛠 **Username:** \`${username}\`\n👤 **Requested by:** ${interaction.user.tag}\n📦 **Data Limit:** 1 GB`)
            .setFooter({ text: "Create Log", iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

          await logChannel.send({ embeds: [logEmbed] });
        } else {
          console.warn("⚠️ Log channel not found or not text-based.");
        }
      } else {
        await interaction.followUp("**No links found**");
      }
    } catch (error) {
      console.error("Error:", error);
      await interaction.followUp("**An error occurred while creating the config**");
    }
  }

  if (commandName === "help") {
    await interaction.deferReply();

    const categories = {
      "📊 آمار و وضعیت": [
        { name: "/botinfo", description: "📌 دریافت وضعیت کلی بات" },
        { name: "/ipinfo", description: "🌍 مشاهده وضعیت IP" },
        { name: "/checkport", description: "🔍 بررسی پورت باز یا بسته بودن" },
      ],
      "⚙️ کانفیگ": [
        { name: "/createconfig", description: "🛠️ ساخت کانفیگ جدید" },
      ],
    };

    const embed = new EmbedBuilder()
      .setColor("#2ECC71")
      .setTitle("📖 راهنمای دستورات")
      .setDescription("سلام! در اینجا می‌تونی لیست تمام دستورات بات رو ببینی 👇")
      .setThumbnail(client.user.displayAvatarURL())
      .setFooter({
        text: "برای دریافت راهنمایی بیشتر روی دکمه زیر کلیک کن",
        iconURL: client.user.displayAvatarURL(),
      })
      .setTimestamp();

    for (const [category, commands] of Object.entries(categories)) {
      embed.addFields({
        name: `__${category}__`,
        value: commands.map((cmd) => `> 🔹 \`${cmd.name}\` → ${cmd.description}`).join("\n"),
        inline: false,
      });
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("📞 پشتیبانی")
        .setStyle(ButtonStyle.Link)
        .setURL("https://discord.gg/2WKKjyuqvr")
    );

    await interaction.followUp({ embeds: [embed], components: [row] });
  }

  if (commandName === "botinfo") {
    await interaction.deferReply();

    const bot = interaction.client;
    const uptime = moment.duration(bot.uptime).format('D [Days], H [Hours], m [Minutes], s [Seconds]');
    const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    const cpuUsage = os.loadavg()[0].toFixed(2);
    const totalServers = bot.guilds.cache.size;
    const totalUsers = bot.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
    const totalChannels = bot.channels.cache.size;

    const embed = new EmbedBuilder()
    .setColor("#1ABC9C")
    .setTitle("✨ Toonel Bot Overview")
    .setDescription([
      `> 🧸 **Bot name:** \`${bot.user.username}\``,
      `> 🧬 Uptime Cycle: \`${uptime}\``,
      `> 📡 Latency: \`${bot.ws.ping}ms\``,
      ``,
    ].join("\n"))
    .setThumbnail(bot.user.displayAvatarURL({ dynamic: true }))
    .addFields(
      {
        name: "🌐 Server Stats",
        value: [
          `• Servers: \`${totalServers.toLocaleString()}\``,
          `• Users: \`${totalUsers.toLocaleString()}\``,
        ].join("\n"),
        inline: true
      },
      {
        name: "🧠 System",
        value: [
          `• RAM: \`${memoryUsage} MB\``,
          `• CPU: \`${cpuUsage}%\``,
        ].join("\n"),
        inline: true
      },
      {
        name: "📌 Usage Stats",
        value: `**Commands Used:** \`${commandCount.toLocaleString()}\``,
        inline: false
      }
    )
    .setFooter({
      text: `Request Logged by ${interaction.user.tag}`,
      iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
    })
    .setTimestamp();
  

    await interaction.editReply({ embeds: [embed] });
  }

  if (commandName === 'ipinfo') {
    const ipOrUrl = interaction.options.getString('ip_or_url');
    await interaction.deferReply({ ephemeral: true });

    try {
      let targetIP = ipOrUrl;
      if (!net.isIP(ipOrUrl)) {
        const dns = require('dns').promises;
        const resolved = await dns.lookup(ipOrUrl);
        targetIP = resolved.address;
      }

      const response = await axios.get(`https://ipinfo.io/${targetIP}/json?token=${ipInfoToken}`);
      const data = response.data;

      const info = `
  **📍 IP Address**: \`${data.ip}\`
  **🌐 Host Name**: ${data.hostname || 'N/A'}
  **🔗 IP Range**: ${data.range || 'N/A'}
  **🌍 ISP**: ${data.org || 'N/A'}
  **🇨🇭 Country**: ${data.country || 'N/A'}
  **🗺 Region**: ${data.region || 'N/A'}
  **🏙 City**: ${data.city || 'N/A'}
  **🕰 Time Zone**: ${data.timezone || 'N/A'}
  **📮 Postal Code**: ${data.postal || 'N/A'}
      `;
      await interaction.editReply({ content: info, ephemeral: true });
    } catch (error) {
      console.error(error);
      await interaction.editReply('Khata');
    }
  }


  if (commandName === 'userinfo') {

    const user = interaction.options.getUser('user') || interaction.user;

    const member = await interaction.guild.members.fetch(user.id);

    const createdAt = moment(user.createdAt).fromNow(); 
    const joinedAt = moment(member.joinedAt).fromNow();
    const embed = new EmbedBuilder()
      .setColor('#1ABC9C')
      .setTitle(`${user.username}'s Profile Information 🌟`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .setDescription(`**${user.username}**'s profile details are here!`)
      .addFields(
        { name: '👤 Username', value: user.tag, inline: true }, 
        { name: '🆔 User ID', value: user.id, inline: true },
        { name: '📅 Joined Server', value: joinedAt, inline: true }, 
        { name: '📅 Account Created', value: createdAt, inline: true }, 
        { name: '👑 Roles', value: member.roles.cache.size > 1 ? member.roles.cache.map(role => role.name).join(', ') : 'No roles', inline: false }
      )
      .setFooter({ text: `Requested by ${interaction.user.username} ✨`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }


});


client.login(token);