const { Client, GatewayIntentBits,Partials ,AuditLogEvent, SlashCommandBuilder, ChannelType,EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder,ModalBuilder,TextInputBuilder,TextInputStyle } = require("discord.js");
const MarzbanAPI = require("@maniwrld/marzjs");
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const ms = require('ms');
const filePath = path.join(__dirname, 'config.json');
const { PermissionsBitField } = require('discord.js');

function getAllowedUserIds() {
  try {
    const data = fs.readFileSync(filePath);
    const parsedData = JSON.parse(data);
    return parsedData.allowedUserIds || [];
  } catch (err) {
    console.error("Error reading JSON file:", err);
    return [];
  }
}


const marzban = MarzbanAPI({
  domain: "",
  port: 2096,
  username: "Sadrafl",
  password: "@",
  ssl: true,
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers, // required 
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,  // Require
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.User, Partials.GuildMember,Partials.Channel],
});
const ips = [
  '159.223.21.178',
  '81.12.33.70',
  '64.23.185.82',
  '138.68.148.224'
];

const ipNames = {
  '159.223.21.178': 'Node 1',
  '81.12.33.70': 'Node 2',
  '64.23.185.82': 'Node 3',
  '138.68.148.224': 'Node 4'
};

function countryCodeToEmoji(code) {
  return code
    .toUpperCase()
    .replace(/./g, char => String.fromCodePoint(127397 + char.charCodeAt()));
}


client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  const channelId = '1353046754668576938';
  const messageId = '1358356325997740133';

  const channel = await client.channels.fetch(channelId);
  if (!channel || !channel.isTextBased()) {
    console.error("❌ Channel not found or not a text-based channel.");
    return;
  }

  let statusMessage;

  try {
    statusMessage = await channel.messages.fetch(messageId);
  } catch (error) {
    console.error("❌ Failed to fetch the status message:", error);
    return;
  }

  const updateStatusEmbed = async () => {
    try {
      const pingAndGeo = await Promise.all(
        ips.map(async (ip) => {
          // 🎯 Ping
          const ping = await new Promise((resolve) => {
            exec(`ping -c 1 ${ip}`, (error, stdout) => {
              if (error) return resolve('❌ Unreachable');
              const match = stdout.match(/time=(\d+\.?\d*) ms/);
              resolve(match ? `${match[1]} ms` : '❌ N/A');
            });
          });
  
          // 🌍 Geo Location
          let flag = '🌐';
          try {
            const res = await fetch(`http://ip-api.com/json/${ip}`);
            const data = await res.json();
            if (data.status === 'success') {
              flag = countryCodeToEmoji(data.countryCode);
            }
          } catch (geoErr) {
            console.warn(`⚠️ Failed to fetch location for ${ip}:`, geoErr.message);
          }
  
          return { ip, ping, flag };
        })
      );
  
      const embed = new EmbedBuilder()
        .setTitle('📡 Live Server Status Monitor')
        .setDescription('Real-time ping and geolocation of all tracked nodes 🌐')
        .setColor(0x00b894)
        .setThumbnail('https://i.pinimg.com/originals/df/8d/89/df8d89917a5964678fa87bd12313c340.gif')
        .setFooter({
          text: '🛰️ Toonel | Ping results provided by Toonel Collection ⚡',
          iconURL: client.user.displayAvatarURL(),
        })
        .setTimestamp();
  
      pingAndGeo.forEach(({ ip, ping, flag }) => {
        embed.addFields({
          name: `${flag} ${ipNames[ip] || ip}`,
          value: ping.startsWith('❌') ? '❌ Unreachable' : `🟢 ${ping}`,
          inline: true,
        });
      });
  
      await statusMessage.edit({ embeds: [embed] });
      console.log('✅ Status embed updated successfully.');
    } catch (err) {
      console.error('❌ Error updating status embed:', err);
    }
  };
  
  // ⚡ First call
  await updateStatusEmbed();
  
  // 🔁 Update every 3 minutes
  setInterval(updateStatusEmbed, 3 * 60 * 1000);
});





client.on('guildMemberAdd', async (member) => {
  const channelId = '1352862254147833927'; // Replace with your log channel ID
  const autoRoleId = '1352423109843488798'; // Your auto-role ID

  const channel = member.guild.channels.cache.get(channelId);
  if (!channel) return;

  const { EmbedBuilder } = require('discord.js');

  // Attempt to add the role
  try {
    await member.roles.add(autoRoleId);
  } catch (err) {
    console.error(`Failed to add role to ${member.user.tag}:`, err);
  }

  const embed = new EmbedBuilder()
    .setColor(0x00ff00)
    .setAuthor({
      name: `${member.user.tag}`,
      iconURL: member.user.displayAvatarURL({ dynamic: true }),
    })
    .setTitle('📥 New Member Joined')
    .setDescription(`Welcome <@${member.id}> to **${member.guild.name}**!`)
    .addFields(
      { name: 'User ID', value: member.id, inline: true },
      { name: 'Account Created', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
      { name: 'Server Member Count', value: `${member.guild.memberCount}`, inline: true }
    )
    .setFooter({ text: `Now at ${member.guild.memberCount} members` })
    .setTimestamp();

  channel.send({ embeds: [embed] });
});


client.on('guildMemberRemove', async (member) => {
  const logChannelId = '1352862254147833927'; // replace with your log channel ID
  const channel = member.guild.channels.cache.get(logChannelId);
  if (!channel) return;

  const { EmbedBuilder } = require('discord.js');

  let reason = 'Unknown';
  let executor = 'Unknown';
  let actionFound = false;

  // Define a time window to check for recent actions (e.g., 5 seconds)
  const timeWindow = 5000;

  // Fetch the audit logs for MEMBER_KICK (type 20) and MEMBER_BAN_ADD (type 22)
  const kickLogs = await member.guild.fetchAuditLogs({
    limit: 1,
    type: 20, // MEMBER_KICK
  });

  const banLogs = await member.guild.fetchAuditLogs({
    limit: 1,
    type: 22, // MEMBER_BAN_ADD
  });

  // Check for a kick within the last 5 seconds
  const kickLog = kickLogs.entries.find(entry => entry.target.id === member.id);
  const banLog = banLogs.entries.find(entry => entry.target.id === member.id);

  if (kickLog && (Date.now() - kickLog.createdTimestamp <= timeWindow)) {
    executor = kickLog.executor.tag;
    reason = kickLog.reason || 'No reason provided';
    actionFound = true;

    const embed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle('🔴 Member Kicked')
      .setDescription(`${member.user.tag} has been kicked.`)
      .addFields(
        { name: 'User', value: member.user.tag, inline: true },
        { name: 'Kicked By', value: executor, inline: true },
        { name: 'Reason', value: reason, inline: false }
      )
      .setTimestamp();

    return channel.send({ embeds: [embed] });
  }

  // Check for a ban within the last 5 seconds
  if (banLog && (Date.now() - banLog.createdTimestamp <= timeWindow)) {
    executor = banLog.executor.tag;
    reason = banLog.reason || 'No reason provided';
    actionFound = true;

    const embed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle('🔴 Member Banned')
      .setDescription(`${member.user.tag} has been banned.`)
      .addFields(
        { name: 'User', value: member.user.tag, inline: true },
        { name: 'Banned By', value: executor, inline: true },
        { name: 'Reason', value: reason, inline: false }
      )
      .setTimestamp();

    return channel.send({ embeds: [embed] });
  }

  // If no kick or ban was detected, log that the member left voluntarily
  if (!actionFound) {
    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle('🔵 Member Left')
      .setDescription(`${member.user.tag} left the server voluntarily.`)
      .setTimestamp();

    channel.send({ embeds: [embed] });
  }
});


client.on('guildBanRemove', async (guild, user) => {
  const logChannelId = '1359966727022313597'; // replace with your log channel ID
  const channel = guild.channels.cache.get(logChannelId);
  if (!channel) return;

  const { EmbedBuilder } = require('discord.js');

  let reason = 'Unknown';
  let executor = 'Unknown';

  // Fetch audit logs to capture unban info
  const fetchedLogs = await guild.fetchAuditLogs({
    limit: 1,
    type: 23, // This corresponds to MEMBER_UNBAN_ADD
  });

  const logEntry = fetchedLogs.entries.find(entry => entry.target.id === user.id);
  if (logEntry) {
    executor = `${logEntry.executor.tag}`;
    reason = logEntry.reason || 'No reason provided';
  }

  const embed = new EmbedBuilder()
    .setColor(0x57F287) // You can adjust the color
    .setTitle('🟢 Member Unbanned')
    .setDescription(`${user.tag} has been unbanned.`)
    .addFields(
      { name: 'User', value: user.tag, inline: true },
      { name: 'Unbanned By', value: executor, inline: true },
      { name: 'Reason', value: reason, inline: false }
    )
    .setTimestamp();

  channel.send({ embeds: [embed] });
});


client.on('voiceStateUpdate', async (oldState, newState) => {
  const logChannelId = '1359970349562855484'; // Replace with your log channel ID
  const channel = newState.guild.channels.cache.get(logChannelId);
  if (!channel) {
    console.log('Log channel not found!');
    return;
  }

  // Debugging log to check old and new state


  const { EmbedBuilder } = require('discord.js');

  // Check for join
  if (!oldState.channel && newState.channel) {
    console.log(`${newState.member.user.tag} joined the channel: ${newState.channel.name}`);

    const embed = new EmbedBuilder()
      .setColor(0x57F287)
      .setTitle('🔊 Member Joined Voice Channel')
      .addFields(
        { name: 'User', value: newState.member.user.tag, inline: true },
        { name: 'Channel', value: newState.channel.name, inline: true }
      )
      .setTimestamp();

    return channel.send({ embeds: [embed] });
  }

  // Check for leave
  if (oldState.channel && !newState.channel) {
    console.log(`${oldState.member.user.tag} left the channel: ${oldState.channel.name}`);

    const embed = new EmbedBuilder()
      .setColor(0xED4245)
      .setTitle('🔊 Member Left Voice Channel')
      .addFields(
        { name: 'User', value: oldState.member.user.tag, inline: true },
        { name: 'Channel', value: oldState.channel.name, inline: true }
      )
      .setTimestamp();

    return channel.send({ embeds: [embed] });
  }

  // Check for switch
  if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
    console.log(`${newState.member.user.tag} switched from channel ${oldState.channel.name} to ${newState.channel.name}`);

    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle('🔊 Member Switched Voice Channel')
      .addFields(
        { name: 'User', value: newState.member.user.tag, inline: true },
        { name: 'Old Channel', value: oldState.channel.name, inline: true },
        { name: 'New Channel', value: newState.channel.name, inline: true }
      )
      .setTimestamp();

    return channel.send({ embeds: [embed] });
  }
});
// Log message edits
// Log message edits
client.on('messageUpdate', async (oldMessage, newMessage) => {
  // If the message content is the same, don't log
  if (oldMessage.content === newMessage.content) return;

  const logChannelId = '1359973769141293137'; // Replace with your log channel ID
  const channel = newMessage.guild.channels.cache.get(logChannelId);
  if (!channel) return;

  const { EmbedBuilder } = require('discord.js');

  // Create an embed for the edited message
  const embed = new EmbedBuilder()
    .setColor(0xFF9E00) // Orange color for edits
    .setTitle('✏️ Message Edited')
    .addFields(
      { name: 'User', value: `<@${newMessage.author.id}>`, inline: true }, // Mention the user
      { name: 'Channel', value: newMessage.channel.name, inline: true },
      { name: 'Before', value: oldMessage.content.slice(0, 100) + '...', inline: false },
      { name: 'After', value: newMessage.content.slice(0, 100) + '...', inline: false }
    )
    .setTimestamp();

  // Send the embed to the log channel
  channel.send({ embeds: [embed] });
});

client.on('messageDelete', async (message) => {
  const logChannelId = '1359973769141293137'; // Replace with your log channel ID
  const channel = message.guild.channels.cache.get(logChannelId);
  if (!channel) return;

  const { EmbedBuilder } = require('discord.js');

  // Create an embed for the deleted message
  const embed = new EmbedBuilder()
    .setColor(0xED4245) // Red color for deletions
    .setTitle('🗑️ Message Deleted')
    .addFields(
      { name: 'User', value: `<@${message.author.id}>`, inline: true }, // Mention the user
      { name: 'Channel', value: message.channel.name, inline: true },
      { name: 'Content', value: message.content.slice(0, 100) + '...', inline: false }
    )
    .setTimestamp();

  // Send the embed to the log channel
  channel.send({ embeds: [embed] });
});

client.on('voiceStateUpdate', async (oldState, newState) => {
  if (oldState.channelId === newState.channelId) return;

  const logChannelId = '1359974414359199905'; // Replace with your log channel ID
  const channel = newState.guild.channels.cache.get(logChannelId);
  if (!channel) return;

  const { EmbedBuilder } = require('discord.js');

  try {
    const auditLogs = await newState.guild.fetchAuditLogs({
      limit: 1,
      type: 26, // Numeric value for MEMBER_UPDATE
    });

    const updateLog = auditLogs.entries.first();
    const executor = updateLog ? updateLog.executor : null;

    const embed = new EmbedBuilder()
      .setColor(0x1E90FF) //
      .setTitle('🔊 Member Moved in Voice')
      .addFields(
        { name: 'User', value: `<@${newState.member.id}>`, inline: true }, // Mention the user
        { name: 'Moved From', value: oldState.channel ? oldState.channel.name : 'None', inline: true },
        { name: 'Moved To', value: newState.channel ? newState.channel.name : 'None', inline: true },
        { name: 'Moved By', value: executor ? `<@${executor.id}>` : 'Unknown', inline: true } // Mention who moved the user
      )
      .setTimestamp();

    // Send the embed to the log channel
    channel.send({ embeds: [embed] });

  } catch (error) {
    console.error("Error fetching audit logs:", error);
  }
});


client.on('guildUpdate', async (oldGuild, newGuild) => {
  const logChannel = newGuild.channels.cache.get('1359977251642413146');
  const fetchedLogs = await newGuild.fetchAuditLogs({ type: AuditLogEvent.GuildUpdate, limit: 1 });
  const log = fetchedLogs.entries.first();
  if (!log) return;

  const embed = new EmbedBuilder()
    .setColor('Yellow')
    .setTitle('⚙️ Guild Updated')
    .setDescription(`Updated by: <@${log.executor.id}>`)
    .addFields(
      { name: 'Old Name', value: oldGuild.name, inline: true },
      { name: 'New Name', value: newGuild.name, inline: true }
    )
    .setTimestamp();

  logChannel.send({ embeds: [embed] });
});

client.on('channelCreate', async (channel) => {
  const logChannel = channel.guild.channels.cache.get('1359977285758750993');
  const fetchedLogs = await channel.guild.fetchAuditLogs({ type: AuditLogEvent.ChannelCreate, limit: 1 });
  const log = fetchedLogs.entries.first();
  if (!log) return;

  const embed = new EmbedBuilder()
    .setColor('Green')
    .setTitle('📥 Channel Created')
    .setDescription(`Channel: <#${channel.id}>\nCreated by: <@${log.executor.id}>`)
    .setTimestamp();

  logChannel.send({ embeds: [embed] });
});

client.on('channelUpdate', async (oldChannel, newChannel) => {
  const logChannel = newChannel.guild.channels.cache.get('1359977285758750993');
  const fetchedLogs = await newChannel.guild.fetchAuditLogs({ type: AuditLogEvent.ChannelUpdate, limit: 1 });
  const log = fetchedLogs.entries.first();
  if (!log) return;

  const embed = new EmbedBuilder()
    .setColor('Orange')
    .setTitle('🔁 Channel Updated')
    .setDescription(`Channel: <#${newChannel.id}>\nUpdated by: <@${log.executor.id}>`)
    .setTimestamp();

  logChannel.send({ embeds: [embed] });
});

client.on('channelDelete', async (channel) => {
  const logChannel = channel.guild.channels.cache.get('1359977285758750993');
  const fetchedLogs = await channel.guild.fetchAuditLogs({ type: AuditLogEvent.ChannelDelete, limit: 1 });
  const log = fetchedLogs.entries.first();
  if (!log) return;

  const embed = new EmbedBuilder()
    .setColor('Red')
    .setTitle('🗑️ Channel Deleted')
    .setDescription(`Channel: ${channel.name}\nDeleted by: <@${log.executor.id}>`)
    .setTimestamp();

  logChannel.send({ embeds: [embed] });
});

client.on('channelPinsUpdate', async (channel, time) => {
  const logChannel = channel.guild.channels.cache.get('1359977348870439184');
  const fetchedLogs = await channel.guild.fetchAuditLogs({ type: AuditLogEvent.MessagePin, limit: 1 });
  const log = fetchedLogs.entries.first();
  if (!log) return;

  const embed = new EmbedBuilder()
    .setColor('Blue')
    .setTitle('📌 Pinned Message Updated')
    .setDescription(`Channel: <#${channel.id}>\nBy: <@${log.executor.id}>`)
    .setTimestamp(new Date(time));

  logChannel.send({ embeds: [embed] });
});



client.on('guildMemberAdd', async (member) => {
  // Check if the member is a bot
  if (!member.user.bot) return;

  const logChannelId = '1359978674853511280';
  const logChannel = member.guild.channels.cache.get(logChannelId);
  if (!logChannel) return;

  try {
    const fetchedLogs = await member.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.BotAdd, // Action Type 28
    });

    const addBotLog = fetchedLogs.entries.first();
    if (!addBotLog) return;

    const { executor, target, createdAt } = addBotLog;

    // Double-check the bot in the audit log is the one that just joined
    if (target.id !== member.id) return;

    const embed = new EmbedBuilder()
      .setColor(0x57F287)
      .setTitle('🤖 Bot Added')
      .addFields(
        { name: 'Bot', value: `<@${target.id}> (${target.tag})`, inline: true },
        { name: 'Invited By', value: `<@${executor.id}> (${executor.tag})`, inline: true },
        { name: 'Time', value: `<t:${Math.floor(createdAt.getTime() / 1000)}:R>`, inline: true }
      )
      .setTimestamp();

    await logChannel.send({ embeds: [embed] });
  } catch (error) {
    console.error('Failed to fetch bot add logs:', error);
  }
});



client.on('guildMemberUpdate', async (oldMember, newMember) => {
  const logChannelId = '1359979313449140386';
  const logChannel = newMember.guild.channels.cache.get(logChannelId);
  if (!logChannel) return;

  try {
    const fetchedLogs = await newMember.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.MemberUpdate, // Action Type 24
    });

    const updateLog = fetchedLogs.entries.first();
    if (!updateLog) return;

    const { executor, target, changes, createdAt } = updateLog;

    if (target.id !== newMember.id) return;

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('🔧 Member Updated')
      .addFields(
        { name: 'User', value: `<@${target.id}> (${target.tag})`, inline: true },
        { name: 'Updated By', value: `<@${executor.id}>`, inline: true },
        { name: 'Time', value: `<t:${Math.floor(createdAt.getTime() / 1000)}:R>`, inline: true }
      )
      .setTimestamp();

    // Optionally, include specific changes
    changes.forEach(change => {
      const key = change.key;
      const oldVal = change.old ?? 'None';
      const newVal = change.new ?? 'None';
      embed.addFields({ name: `Changed: ${key}`, value: `\`${oldVal}\` ➜ \`${newVal}\``, inline: false });
    });

    await logChannel.send({ embeds: [embed] });
  } catch (error) {
    console.error('Failed to fetch member update logs:', error);
  }
});
client.on('guildMemberAdd', async (member) => {
  const welcomeChannelId = '1359973863865450546';
  const channel = member.guild.channels.cache.get(welcomeChannelId);
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setColor(0x00FFAB)
    .setTitle('🌟 Welcome to the Server! 🌟')
    .setDescription(`
> **👋〢Hey <@${member.id}>! Welcome to ${member.guild.name}!**
> **📜〢Please make sure to read the ~~rules~~ and have fun!**
> **👥〢You're member #${member.guild.memberCount}**
    `)
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .setImage('https://media.giphy.com/media/OkJat1YNdoD3W/giphy.gif')
    .setFooter({
      text: `Welcome aboard!`,
      iconURL: member.guild.iconURL({ dynamic: true }),
    })
    .setTimestamp();

  channel.send({embeds: [embed] });
});



client.on('guildMemberUpdate', async (oldMember, newMember) => {
  const logChannelId = '1359964154173194270';
  const channel = newMember.guild.channels.cache.get(logChannelId);
  if (!channel) return;

  const oldRoles = new Set(oldMember.roles.cache.map(role => role.id));
  const newRoles = new Set(newMember.roles.cache.map(role => role.id));

  const addedRoles = [...newRoles].filter(roleId => !oldRoles.has(roleId));
  const removedRoles = [...oldRoles].filter(roleId => !newRoles.has(roleId));

  if (addedRoles.length === 0 && removedRoles.length === 0) return;

  const added = addedRoles.map(r => `<@&${r}>`).join(', ');
  const removed = removedRoles.map(r => `<@&${r}>`).join(', ');

  const fields = [];
  if (addedRoles.length) {
    fields.push({ name: '➕ Roles Added', value: added, inline: false });
  }
  if (removedRoles.length) {
    fields.push({ name: '➖ Roles Removed', value: removed, inline: false });
  }

  // 🔍 Fetch audit logs to get the executor
  let executor = 'Unknown';
  try {
    const fetchedLogs = await newMember.guild.fetchAuditLogs({
      limit: 5,
      type: 25, // MEMBER_ROLE_UPDATE
    });

    const logEntry = fetchedLogs.entries.find(entry =>
      entry.target.id === newMember.id &&
      Date.now() - entry.createdTimestamp < 5000 // role change within last 5 seconds
    );

    if (logEntry) {
      executor = `${logEntry.executor.tag}`;
    }
  } catch (err) {
    console.error('Error fetching audit logs:', err);
  }

  const { EmbedBuilder } = require('discord.js');

  const embed = new EmbedBuilder()
    .setColor(0x3498db)
    .setAuthor({
      name: `${newMember.user.tag}`,
      iconURL: newMember.user.displayAvatarURL({ dynamic: true }),
    })
    .setTitle('🔁 Member Role Updated')
    .setDescription(`<@${newMember.id}> had their roles updated.`)
    .addFields(
      ...fields,
      { name: '👤 Changed By', value: executor, inline: false }
    )
    .setTimestamp();

  channel.send({ embeds: [embed] });
});
client.on('inviteCreate', async (invite) => {
  const logChannelId = '1359965893886611637';
  const channel = invite.guild.channels.cache.get(logChannelId);
  if (!channel) return;

  const { EmbedBuilder } = require('discord.js');

  const embed = new EmbedBuilder()
    .setColor(0x57F287)
    .setTitle('➕ Invite Created')
    .addFields(
      { name: 'Code', value: invite.code, inline: true },
      { name: 'Channel', value: `<#${invite.channel.id}>`, inline: true },
      { name: 'Max Uses', value: invite.maxUses?.toString() ?? '∞', inline: true },
      { name: 'Expires At', value: invite.expiresAt ? `<t:${Math.floor(invite.expiresAt.getTime() / 1000)}:R>` : 'Never', inline: true },
      { name: 'Created By', value: invite.inviter ? `<@${invite.inviter.id}>` : 'Unknown', inline: true }
    )
    .setTimestamp();

  channel.send({ embeds: [embed] });
});
client.on('inviteDelete', async (invite) => {
  const logChannelId = '1359965893886611637';
  const channel = invite.guild.channels.cache.get(logChannelId);
  if (!channel) return;

  const { EmbedBuilder } = require('discord.js');

  const embed = new EmbedBuilder()
    .setColor(0xED4245)
    .setTitle('➖ Invite Deleted')
    .addFields(
      { name: 'Code', value: invite.code, inline: true },
      { name: 'Channel', value: invite.channel ? `<#${invite.channel.id}>` : 'Unknown', inline: true }
    )
    .setTimestamp();

  channel.send({ embeds: [embed] });
});


client.on('guildMemberRemove', async (member) => {
  const channelId = '1352862254147833927'; // Replace with your leave log channel ID
  const channel = member.guild.channels.cache.get(channelId);
  if (!channel) return;

  const { EmbedBuilder } = require('discord.js');

  const embed = new EmbedBuilder()
    .setColor(0xff0000)
    .setAuthor({
      name: `${member.user.tag}`,
      iconURL: member.user.displayAvatarURL({ dynamic: true }),
    })
    .setTitle('📤 Member Left')
    .setDescription(`${member.user.tag} has left **${member.guild.name}**.`)
    .addFields(
      { name: 'User ID', value: member.id, inline: true },
      { name: 'Joined Server', value: member.joinedAt ? `<t:${Math.floor(member.joinedAt / 1000)}:R>` : 'Unknown', inline: true },
      { name: 'New Member Count', value: `${member.guild.memberCount}`, inline: true }
    )
    .setFooter({ text: `Now at ${member.guild.memberCount} members` })
    .setTimestamp();

  channel.send({ embeds: [embed] });
});

client.once("ready", async () => {
  console.log(`🟢 ${client.user.tag} is now online.`);

  client.user.setPresence({
    status: "online",
    activities: [{ name: "Booting up...", type: 4 }]
  });

  try {
    const guildId = "1347376865223901185";
    const channelId = "1352672714757902409";  

    const guild = await client.guilds.fetch(guildId);
    const channel = await guild.channels.fetch(channelId);

    if (channel && channel.isTextBased()) {
      const embed = new EmbedBuilder()
        .setTitle("🛰️ Bot Activated")
        .setDescription(`**${client.user.username}** is now online and ready to serve 🚀`)
        .setColor(0x00ffff)
        .setThumbnail(client.user.displayAvatarURL({ size: 1024 }))
        .setFields(
          { name: "Status", value: "🟢 Online", inline: true },
          { name: "Latency", value: `${client.ws.ping}ms`, inline: true },
        )
        .setFooter({
          text: `Powered by ${client.user.username}`,
          iconURL: client.user.displayAvatarURL()
        })
        .setTimestamp();

      await channel.send({ embeds: [embed] });
    }

  } catch (error) {
    console.error("❌ Failed to send startup message:", error);
  }
  ///////////////////////////    help ///////////////////////////////
  const guildId = "1347376865223901185";
  const guild = await client.guilds.fetch(guildId);
  //`/help`
  await guild.commands.create(
    new SlashCommandBuilder()
      .setName("help")
      .setDescription("📜 نمایش لیست کامل کامندهای بات")
  );

  ///////////////////////////    Core System Management ///////////////////////////////
  //corestats
  await guild.commands.create(
    new SlashCommandBuilder()
      .setName("corestats")
      .setDescription("Fetches core statistics")
  );
  //// baghiash badam

  // await guild.commands.create(
  //   new SlashCommandBuilder()
  //     .setName("mahbodsadra")
  //     .setDescription("Test")
  //     .setDMPermission(false)
  //     .setDefaultMemberPermissions(0)
  // )
  // .then(command => {
  //     command.permissions.add({
  //         user: ["260482864972300289", "123201277806116865"], 
  //         permissions: [
  //             {
  //                 id: "123201277806116865",
  //                 type: "USER",
  //                 permission: true,
  //             },
  //             {
  //                 id: "260482864972300289",
  //                 type: "USER",
  //                 permission: true,
  //             },
  //         ],
  //     });
  // });



  ////////////////////////////// Admin Operations /////////////////////////////
  await guild.commands.create(
    new SlashCommandBuilder()
      .setName("currentadmin")
      .setDescription("Fetches information about the current admin.")
  );

  await guild.commands.create(
    new SlashCommandBuilder()
      .setName("createadmin")
      .setDescription("Creates a new admin.")
      .addStringOption((option) =>
        option
          .setName("username")
          .setDescription("Enter the username for the new admin.")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("password")
          .setDescription("Enter the password for the new admin.")
          .setRequired(true)
      )
  );

  await guild.commands.create(
    new SlashCommandBuilder()
      .setName("removeadmin")
      .setDescription("Removes an admin.")
      .addStringOption((option) =>
        option
          .setName("username")
          .setDescription("Enter the username of the admin to remove.")
          .setRequired(true)
      )
  );


  await guild.commands.create(
    new SlashCommandBuilder()
      .setName("getadmins")
      .setDescription("Fetches a list of all admins.")
  );

  await guild.commands.create(
    new SlashCommandBuilder()
      .setName("vpn")
      .setDescription("vpn toonel")
  );
  ////////////////////// System Insights   /////////////////

  /// Get system stats
  await guild.commands.create(
    new SlashCommandBuilder()
      .setName("getsystemstats")
      .setDescription("Fetches system statistics including CPU usage, memory, and more.")
  );

  ///  Get inbounds 
  await guild.commands.create(
    new SlashCommandBuilder()
      .setName("getinbounds")
      .setDescription("Fetches system inbounds information.")
  );

  ///// Get hosts
  await guild.commands.create(
    new SlashCommandBuilder()
      .setName("gethosts")
      .setDescription("Fetches system hosts information.")
  );
  ///////////////////////////    User Management ///////////////////////////////////


  //createconfig
  await guild.commands.create(
    new SlashCommandBuilder()
      .setName("createconfig")
      .setDescription("Generates a new VPN config for a user.")
      .addStringOption((option) =>
        option.setName("username")
          .setDescription("Enter the username for the config")
          .setRequired(true)
      )
      .addIntegerOption((option) =>
        option.setName("data_limit")
          .setDescription("The data limit in GB (Max 50GB, optional)")
          .setRequired(false)
          .setMinValue(1)
          .setMaxValue(50)
      )
      .addIntegerOption((option) =>
        option.setName("expire")
          .setDescription("The expiration time in days (Max 30 days, optional)")
          .setRequired(false)
          .setMinValue(1)
          .setMaxValue(30)
      )
  );

  //getusers
  await guild.commands.create(
    new SlashCommandBuilder()
      .setName("getusers")
      .setDescription("Fetches a list of all VPN users.")
  );
  await guild.commands.create(
    new SlashCommandBuilder()
      .setName("bug")
      .setDescription("bug report")
  );

  //removeuser
  await guild.commands.create(
    new SlashCommandBuilder()
      .setName("removeuser")
      .setDescription("Removes a VPN user.")
      .addStringOption((option) =>
        option.setName("username").setDescription("Enter the username to remove").setRequired(true)
      )
  );
  //// Get user usage
  await guild.commands.create(
    new SlashCommandBuilder()
      .setName("getuserusage")
      .setDescription("Fetches the usage stats of a specific user.")
      .addStringOption((option) =>
        option.setName("username").setDescription("Enter the username to fetch usage for").setRequired(true)
      )
  );
  /// Reset User Data Usage
  await guild.commands.create(
    new SlashCommandBuilder()
      .setName("resetuserusage")
      .setDescription("Resets the data usage of a specific user.")
      .addStringOption((option) =>
        option.setName("username").setDescription("Enter the username to reset data usage for").setRequired(true)
      )
  );
  /// Get expired users
  await guild.commands.create(
    new SlashCommandBuilder()
      .setName("getexpiredusers")
      .setDescription("Fetches a list of all expired users.")
  );
  //// Delete expired users
  await guild.commands.create(
    new SlashCommandBuilder()
      .setName("deleteexpiredusers")
      .setDescription("Deletes all expired users from the system.")
  );

  await guild.commands.create(
    new SlashCommandBuilder()
      .setName("statusserver")
      .setDescription("Checks ping status of servers.")
  );
  //////Get user
  await guild.commands.create(
    new SlashCommandBuilder()
      .setName("getuser")
      .setDescription("Fetches the information of a specific VPN user.")
      .addStringOption((option) =>
        option.setName("username").setDescription("Enter the username to get information").setRequired(true)
      )
  );
});
////////////////////////////////////////////////////////////////////////////////////////////




client.on("interactionCreate", async (interaction) => {
  if (interaction.isModalSubmit()) {
    const accept = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('accept')
          .setLabel('Answer')
          .setStyle(ButtonStyle.Success)
      )
    // .addComponents(
    //   new ButtonBuilder()
    //     .setCustomId('no')
    //     .setLabel('no config')
    //     .setStyle(ButtonStyle.Success)
    // );
    const reportchannel = client.channels.cache.get('1352422773225685023');
    if (interaction.customId === 'myModal') {
      const favoriteColor = interaction.fields.getTextInputValue('favoriteColorInput');
      const sendbugem = new EmbedBuilder()
        .setThumbnail(`${interaction.user.displayAvatarURL()}`)
        .setAuthor({
          iconURL: interaction.user.displayAvatarURL(),

          name: interaction.user.tag
        })
        .setDescription(`${favoriteColor}`)
        .setColor(0xfc03cf)
        .setTimestamp()
        .setFooter({
          iconURL: client.user.displayAvatarURL(),
          text: client.user.username
        })
      const dmem = new EmbedBuilder()
        .setThumbnail(`${interaction.user.displayAvatarURL()}`)
        .setAuthor({
          iconURL: interaction.user.displayAvatarURL(),

          name: interaction.user.tag
        })
        .setDescription(`
باگ شما در چنل <#1352422773225685023> ارسال شد
منتظر پاسخ کانفیگرهای سرور باشید
باگ ارسالی شما : ${favoriteColor}
`)
        .setColor(0xfc03cf)
        .setTimestamp()
        .setFooter({
          iconURL: client.user.displayAvatarURL(),
          text: client.user.username
        })
      interaction.reply({ content: "باگ شما تا 10 ثانیه دیگه ارسال خواهد شد\nنتیجه توسط بات در dm شما ارسال می شود", ephemeral: true }).then(

      )
      let time = "10s";

      setTimeout(function () {
        reportchannel.send({ content: `${interaction.user}|<@&1347377546420813845>`, embeds: [sendbugem], components: [accept] }).catch(() => {/*Ignore error*/ }).then(interaction.user.send({ embeds: [dmem] })).catch(() => {/*Ignore error*/ });
      }, ms(time))

    }

    if (interaction.customId === 'accept') {
      const accept = interaction.fields.getTextInputValue('acceptdev');

      if (interaction.member.roles.cache.find(r => r.id === '1347377546420813845') || interaction.member.roles.cache.find(r => r.id === '1074546171235803138') || interaction.member.roles.cache.find(r => r.id === '1010267128005410827')) {
        return interaction.reply({
          content: `Configure : ${interaction.user}
Answer : ${accept}`, ephemeral: false
        }).then(interaction.user.send({ content: `${accept}` })

        )
      } else (interaction.reply({ content: `شما کانفیگر نیستید`, ephemeral: true }))
    }
  }
  if (interaction.commandName === "bug") {
    if (interaction.guild === null) return;
    if (interaction.user.id === "123201277806116865") {
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId("bug2")
            .setLabel("Bug Report")
            .setStyle(ButtonStyle.Secondary)
        )
        // .addComponents(
        //   new ButtonBuilder()
        //     .setCustomId("connect")
        //     .setLabel("Voice Support")
        //     .setStyle(ButtonStyle.Secondary)
        // );

      const bugc = client.channels.cache.get("1358204994725347568");

      const bugem = new EmbedBuilder()
        .setThumbnail(
          "https://cdn.discordapp.com/avatars/1352713302085468191/8895fe4e5fe3c1e577a0bdaefa13f2af.png?size=1024"
        )
        .setTitle("Bug Reports")
        // .setDescription(
        //   ``
        // )
        .setImage(
          "https://cdn.discordapp.com/attachments/1071511789906448539/1081584966577692793/giphy-1.gif"
        )
        .setColor(0xfc03cf)
        .setTimestamp()
        .setFooter({
          iconURL: client.user.displayAvatarURL(),
          text: client.user.username,
        });
      bugc.send({ embeds: [bugem], components: [row] }).catch(() => {
        /*Ignore error*/
      });
      interaction.reply({ content: "Done", ephemeral: true });
    } else
      await interaction.reply({
        content: "Chikar mikoni nadar kochiike",
        ephemeral: true,
      });
  }
  if (interaction.isButton()) {
    const modal = new ModalBuilder()
      .setCustomId('myModal')
      .setTitle('BUG REPORT');
    const favoriteColorInput = new TextInputBuilder()
      .setCustomId('favoriteColorInput')
      .setMaxLength(250)
      .setMinLength(10)
      .setPlaceholder('حداقل 10 حرف')
      // The label is the prompt the user sees for this input
      .setLabel("متن باگ خود را بنویسید")
      // Short means only a single line of text
      .setStyle(TextInputStyle.Short);

    const firstActionRow = new ActionRowBuilder().addComponents(favoriteColorInput);

    const accept = new ModalBuilder()
      .setCustomId('accept')
      .setTitle('BUG REPORT');
    const acceptrowin = new TextInputBuilder()
      .setCustomId('acceptdev')
      .setMaxLength(300)
      // The label is the prompt the user sees for this input
      .setLabel("متن جواب خود را بنویسید")
      // Short means only a single line of text
      .setStyle(TextInputStyle.Short);

    const acceptrow = new ActionRowBuilder().addComponents(acceptrowin);

    // Add inputs to the modal
    modal.addComponents(firstActionRow);
    accept.addComponents(acceptrow);

    if (interaction.customId === 'bug2') {

      interaction.showModal(modal).catch(() => {/*Ignore error*/ })

    }

    if (interaction.customId === 'accept') {

      interaction.showModal(accept).catch(() => {/*Ignore error*/ })

    }
    if (interaction.customId === 'reject') {

      interaction.showModal(accept).catch(() => {/*Ignore error*/ })

    }
    if (interaction.customId === 'connect') {
      const member = interaction.member
      if (interaction.member.roles.cache.find(r => r.id === '1082225242044375110')) {
        interaction.reply({ content: `ارتباط قطع شد`, ephemeral: true }).then(
          member.roles.remove("1082225242044375110").catch(() => {/*Ignore error*/ })
        )

      } else (
        interaction.reply({ content: `ارتباط شما وصل شد \n لطفا وارد وویس <#1003945786654076933> شوید \n 30 ثانیه فرصت دارید وارد وویس شوید`, ephemeral: true }).then(
          member.roles.add("1082225242044375110").catch(() => {/*Ignore error*/ })

        )

      )

      let time = "10s";
      setTimeout(function () {
        member.roles.remove("1082225242044375110").catch(() => {/*Ignore error*/ })
      }, ms(time))
    }
  }
  if (!interaction.isCommand()) return;

  const allowedUserIds = getAllowedUserIds();


  if (!allowedUserIds.includes(interaction.user.id)) {
    return interaction.reply({
      content: `sarhang sepi khals dar mahal \n che gohi mikhori ??? ${interaction.user}`,
      flags: 64
    });
  }



  if (interaction.commandName === "createconfig") {
    await interaction.deferReply();
  
    const username = interaction.options.getString("username");
    const dataLimitInput = interaction.options.getInteger("data_limit"); // in GB
    const expireInput = interaction.options.getInteger("expire"); // in days
  
    const dataLimit = dataLimitInput ? dataLimitInput * 1024 * 1024 * 1024 : 0;
    const expire = expireInput ? Math.floor(Date.now() / 1000) + expireInput * 24 * 60 * 60 : 0; // UNIX timestamp in seconds
  
    const userData = {
      status: "active",
      username: username,
      note: "Created using Discord Bot",
      proxies: { vless: {} },
      data_limit: dataLimit,
      expire: expire,
      data_limit_reset_strategy: "no_reset",
      inbounds: { vless: ["Vless"] },
    };
  
    try {
      await marzban.user.addUser(userData);
      const userInfo = await marzban.user.getUser(username);
      console.log("User Info:", userInfo);
  
      if (Array.isArray(userInfo?.links) && userInfo.links.length > 0) {
        const configLinks = userInfo.links.map((link, index) => `**Config ${index + 1}:**\n\`\`\`${link}\`\`\``).join("\n");
  
        const embed = new EmbedBuilder()
          .setColor("#0099ff")
          .setTitle("🌐 VPN Configuration")
          .setDescription(`✅ **Username:** \`${username}\`\n📦 **Data Limit:** ${dataLimit > 0 ? `${dataLimitInput} GB` : 'Unlimited'}\n📅 **Expire:** ${expire ? `<t:${expire}:R>` : 'Never'}\n\n${configLinks}`)
          .setFooter({ text: "Created using Discord Bot", iconURL: client.user.displayAvatarURL() })
          .setTimestamp();
  
        await interaction.followUp({ embeds: [embed] });
  
        const logChannel = client.channels.cache.get("1347913712475832391");
        if (logChannel?.isTextBased()) {
          const logEmbed = new EmbedBuilder()
            .setColor("#ffcc00")
            .setTitle("📌 New VPN Config Created")
            .setDescription(
              `🛠 **Username:** \`${username}\`\n` +
              `👤 **Requested by:** ${interaction.user.tag}\n` +
              `📅 **Expires:** ${expire ? `<t:${expire}:R>` : 'Never'}\n` +
              `📦 **Data Limit:** ${dataLimit > 0 ? `${dataLimitInput} GB` : 'Unlimited'}`
            )
            .setFooter({ text: "Create Log", iconURL: client.user.displayAvatarURL() })
            .setTimestamp();
  
          await logChannel.send({ embeds: [logEmbed] });
        }
      } else {
        await interaction.followUp("⚠️ **No config links were returned.**");
      }
    } catch (error) {
      console.error("Error:", error);
      await interaction.followUp("❌ **An error occurred while creating the config.**");
    }
  }




  

  // if (interaction.commandName === "mahbodsadra") {
  //   await interaction.deferReply();
  //   if (!["260482864972300289", "123201277806116865"].includes(interaction.user.id)) {
  //     return interaction.reply({ 
  //       content: "Nadar kochiiike chikar mikoni", 
  //       ephemeral: true 
  //     });
  //   }
  //   await interaction.reply("FIxe fixe");
  // }
  if (interaction.commandName === "statusserver") {
    await interaction.deferReply();
  
    const pingAndGeo = await Promise.all(ips.map(async ip => {
      const ping = await new Promise(resolve => {
        exec(`ping -c 1 ${ip}`, (error, stdout) => {
          if (error) return resolve('❌ Unreachable');
          const match = stdout.match(/time=(\d+\.?\d*) ms/);
          resolve(match ? `${match[1]} ms` : 'N/A');
        });
      });
  
      let flag = '🌐';
      try {
        const res = await fetch(`http://ip-api.com/json/${ip}`);
        const data = await res.json();
        if (data.status === 'success') {
          flag = countryCodeToEmoji(data.countryCode);
        }
      } catch (e) {
        console.error(`Failed to fetch location for ${ip}:`, e);
      }
  
      return { ip, ping, flag };
    }));
  
    const embed = new EmbedBuilder()
      .setTitle('📶 Server Ping Status')
      .setDescription('Check the current ping and location of each node:')
      .setColor(0x1abc9c)
      .setThumbnail('https://i.pinimg.com/originals/df/8d/89/df8d89917a5964678fa87bd12313c340.gif')
      .setFooter({ text: 'Ping results provided by your bot ⚡', iconURL: client.user.displayAvatarURL() })
      .setTimestamp();
  
    pingAndGeo.forEach(({ ip, ping, flag }) => {
      embed.addFields({
        name: `${flag} ${ipNames[ip] || ip}`,
        value: ping.startsWith('❌') ? '❌ Unreachable' : `✅ ${ping}`,
        inline: true
      });
    });  
    await interaction.editReply({ embeds: [embed] });
  }

  if (interaction.commandName === "getusers") {
    await interaction.deferReply();

    try {
      const response = await marzban.user.getUsers();
      if (response && response.length > 0) {
        const usersList = response.map((user, index) => `\`${index + 1}.\` **${user.username}** - Status: ${user.status}`).join("\n");

        const embed = new EmbedBuilder()
          .setColor("#2ecc71")
          .setTitle("📋 List of VPN Users")
          .setDescription(usersList)
          .setFooter({ text: "Toonel vpn", iconURL: client.user.displayAvatarURL() })
          .setTimestamp();

        await interaction.followUp({ embeds: [embed] });
      } else {
        await interaction.followUp("**No users found in the system**");
      }
    } catch (error) {
      console.error(`Error listing users:`, error);
      await interaction.followUp(error)
    }
  }

  if (interaction.commandName === "removeuser") {
    await interaction.deferReply();

    const username = interaction.options.getString("username");

    try {
      const response = await marzban.user.removeUser(username);
      console.log("User removed successfully:", response);

      const embed = new EmbedBuilder()
        .setColor("#ff4747")
        .setTitle("❌ User Removed")
        .setDescription(`🗑 **Username:** \`${username}\` has been removed successfully.`)
        .setFooter({ text: "Toonel", iconURL: client.user.displayAvatarURL() })
        .setTimestamp();

      await interaction.followUp({ embeds: [embed] });

      const logChannel = client.channels.cache.get("1347913712475832391");
      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setColor("#ff4747")
          .setTitle("📌 User Removed")
          .setDescription(`🗑 **Username:** \`${username}\`\n👤 **Requested by:** ${interaction.user.tag}`)
          .setFooter({ text: "Removal Log", iconURL: client.user.displayAvatarURL() })
          .setTimestamp();

        await logChannel.send({ embeds: [logEmbed] });
      }
    } catch (error) {
      console.error("Error removing user:", error.message);
      await interaction.followUp("**An error occurred while removing the user.**");
    }
  }



  if (interaction.commandName === "corestats") {
    await interaction.deferReply();

    try {
      const core_stats = await marzban.core.getCoreStats();
      console.log("Core Stats:", core_stats);

      if (core_stats) {
        const embed = new EmbedBuilder()
          .setColor("#ff5733")
          .setTitle("📊 Core Statistics")
          .setDescription(`**Current Core Stats:**\n\nStatus: \`${core_stats.status}\`\nUptime: \`${core_stats.uptime}\`\nUsers: \`${core_stats.users}\`\nActive Proxies: \`${core_stats.active_proxies}\`\nData Transferred: \`${core_stats.data_transferred}\` MB`)
          .setFooter({ text: "Core Stats", iconURL: client.user.displayAvatarURL() })
          .setTimestamp();

        await interaction.followUp({ embeds: [embed] });
      } else {
        await interaction.followUp("**Failed to retrieve core stats.**");
      }
    } catch (error) {
      console.error("Error while getting core stats:", error.message);
      await interaction.followUp("**An error occurred while fetching core stats**");
    }
  }


  if (interaction.commandName === "currentadmin") {
    await interaction.deferReply();

    try {
      const response = await marzban.admin.getCurrentAdmin();
      console.log("Current Admin:", response);

      if (response) {
        const embed = new EmbedBuilder()
          .setColor("#9b59b6")
          .setTitle("👑 Current Admin Information")
          .setDescription(`**Current Admin:**\n\n**Username:** \`${response.username}\`\n**Email:** \`${response.email}\`\n**Status:** \`${response.status}\`\n**Created At:** \`${response.createdAt}\``)
          .setFooter({ text: "Admin Info", iconURL: client.user.displayAvatarURL() })
          .setTimestamp();

        await interaction.followUp({ embeds: [embed] });
      } else {
        await interaction.followUp("⚠ **Failed to retrieve current admin information.**");
      }
    } catch (error) {
      console.error("Error getting current admin:", error.message);
      await interaction.followUp("❌ **An error occurred while fetching current admin information.**");
    }
  }

  if (interaction.commandName === "createadmin") {
    await interaction.deferReply();

    const username = interaction.options.getString("username");
    const password = interaction.options.getString("password");

    const adminData = {
      username: username,
      is_sudo: true,
      telegram_id: 0,
      discord_webhook: "",
      password: password,
    };

    try {
      const response = await marzban.admin.createAdmin(adminData);
      console.log("Admin Created:", response);

      if (response) {
        const embed = new EmbedBuilder()
          .setColor("#3498db")
          .setTitle("👑 New Admin Created")
          .setDescription(`**Username:** \`${username}\`\n**Status:** Admin created successfully.`)
          .setFooter({ text: "Admin Management", iconURL: client.user.displayAvatarURL() })
          .setTimestamp();

        await interaction.followUp({ embeds: [embed] });

        const logChannel = client.channels.cache.get("1347913712475832391");
        if (logChannel) {
          const logEmbed = new EmbedBuilder()
            .setColor("#ffcc00")
            .setTitle("📌 New Admin Created")
            .setDescription(`🛠 **Username:** \`${username}\`\n👤 **Requested by:** ${interaction.user.tag}`)
            .setFooter({ text: "Admin Log", iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

          await logChannel.send({ embeds: [logEmbed] });
        }
      } else {
        await interaction.followUp("**Failed to create the admin.**");
      }
    } catch (error) {
      console.error("Error creating admin:", error.message);
      await interaction.followUp("**An error occurred while creating the admin.**");
    }
  }

  if (interaction.commandName === "removeadmin") {
    await interaction.deferReply();

    const username = interaction.options.getString("username");

    try {
      const response = await marzban.admin.removeAdmin(username);
      console.log("Admin Removed:", response);

      if (response) {
        const embed = new EmbedBuilder()
          .setColor("#e74c3c")
          .setTitle("🚫 Admin Removed")
          .setDescription(`**Username:** \`${username}\`\n**Status:** Admin removed successfully.`)
          .setFooter({ text: "Admin Management", iconURL: client.user.displayAvatarURL() })
          .setTimestamp();

        await interaction.followUp({ embeds: [embed] });

        const logChannel = client.channels.cache.get("1347913712475832391");
        if (logChannel) {
          const logEmbed = new EmbedBuilder()
            .setColor("#ff5733")
            .setTitle("📌 Admin Removed")
            .setDescription(`🚫 **Username:** \`${username}\`\n👤 **Requested by:** ${interaction.user.tag}`)
            .setFooter({ text: "Admin Log", iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

          await logChannel.send({ embeds: [logEmbed] });
        }
      } else {
        await interaction.followUp("**Failed to remove the admin.**");
      }
    } catch (error) {
      console.error("Error removing admin:", error.message);
      await interaction.followUp("❌ **An error occurred while removing the admin.**");
    }
  }

  if (interaction.commandName === "getadmins") {
    await interaction.deferReply();

    try {
      const response = await marzban.admin.getAdmins();
      if (response && response.length > 0) {
        const adminsList = response.map((admin, index) => `\`${index + 1}.\` **${admin.username}** - Sudo: ${admin.is_sudo ? "Yes" : "No"}`).join("\n");

        const embed = new EmbedBuilder()
          .setColor("#3498db")
          .setTitle("📋 List of Admins")
          .setDescription(adminsList)
          .setFooter({ text: "Admin Management", iconURL: client.user.displayAvatarURL() })
          .setTimestamp();

        await interaction.followUp({ embeds: [embed] });
      } else {
        await interaction.followUp("**No admins found in the system.**");
      }
    } catch (error) {
      console.error(`Error listing admins:`, error.message);
      await interaction.followUp("**An error occurred while fetching the admins list.**");
    }
  }

  if (interaction.commandName === "getuserusage") {
    await interaction.deferReply();

    const username = interaction.options.getString("username");

    try {
      const response = await marzban.user.getUserUsage(username);
      if (response) {
        const usageInfo = `
          **Username:** ${username}
          **Data Usage:** ${response.data_usage} MB
          **Data Limit:** ${response.data_limit} MB
          **Expire Date:** ${new Date(response.expire * 1000).toLocaleDateString()}
        `;

        const embed = new EmbedBuilder()
          .setColor("#8e44ad")
          .setTitle("📊 User Usage Stats")
          .setDescription(usageInfo)
          .setFooter({ text: "Usage Information", iconURL: client.user.displayAvatarURL() })
          .setTimestamp();

        await interaction.followUp({ embeds: [embed] });
      } else {
        await interaction.followUp(`**No usage data found for user: ${username}.**`);
      }
    } catch (error) {
      console.error(`Error getting user's usage:`, error.message);
      await interaction.followUp("**An error occurred while fetching the user's usage data.**");
    }
  }

  if (interaction.commandName === "resetuserusage") {
    await interaction.deferReply();

    const username = interaction.options.getString("username");

    try {
      const response = await marzban.user.resetUserDataUsage(username);
      if (response) {
        const embed = new EmbedBuilder()
          .setColor("#e74c3c")
          .setTitle("⚠️ User Data Usage Reset")
          .setDescription(`✅ The data usage for **${username}** has been successfully reset.`)
          .setFooter({ text: "User Data Reset", iconURL: client.user.displayAvatarURL() })
          .setTimestamp();

        await interaction.followUp({ embeds: [embed] });
      } else {
        await interaction.followUp(`**Failed to reset data usage for user: ${username}.**`);
      }
    } catch (error) {
      console.error(`Error resetting user's usage:`, error.message);
      await interaction.followUp("**An error occurred while resetting the user's data usage.**");
    }
  }

  if (interaction.commandName === "getexpiredusers") {
    await interaction.deferReply();

    try {
      const response = await marzban.user.getExpiredUsers();
      if (response && response.length > 0) {
        const expiredUsersList = response.map((user, index) => `\`${index + 1}.\` **${user.username}** - Expired at: ${user.expiry}`).join("\n");

        const embed = new EmbedBuilder()
          .setColor("#e74c3c")
          .setTitle("🕓 List of Expired Users")
          .setDescription(expiredUsersList)
          .setFooter({ text: "Expired Users", iconURL: client.user.displayAvatarURL() })
          .setTimestamp();

        await interaction.followUp({ embeds: [embed] });
      } else {
        await interaction.followUp("**No expired users found in the system.**");
      }
    } catch (error) {
      console.error(`Error listing expired users:`, error.message);
      await interaction.followUp("**An error occurred while fetching the expired users list.**");
    }
  }

  if (interaction.commandName === "deleteexpiredusers") {
    await interaction.deferReply();

    try {
      const response = await marzban.user.deleteExpiredUsers();
      if (response && response.success) {
        const embed = new EmbedBuilder()
          .setColor("#e74c3c")
          .setTitle("🗑️ Expired Users Deleted")
          .setDescription("✅ All expired users have been successfully deleted.")
          .setFooter({ text: "Expired Users Deletion", iconURL: client.user.displayAvatarURL() })
          .setTimestamp();

        await interaction.followUp({ embeds: [embed] });
      } else {
        await interaction.followUp("**No expired users were found to delete.**");
      }
    } catch (error) {
      console.error(`Error deleting expired users:`, error.message);
      await interaction.followUp("**An error occurred while deleting the expired users.**");
    }
  }

  if (interaction.commandName === "getsystemstats") {
    await interaction.deferReply();

    try {
      const systemStats = await marzban.system.getSystemStats();
      if (systemStats) {
        const embed = new EmbedBuilder()
          .setColor("#3498db")
          .setTitle("📊 System Statistics")
          .addFields(
            { name: "CPU Usage", value: `${systemStats.cpu_usage}%`, inline: true },
            { name: "Memory Usage", value: `${systemStats.memory_usage}%`, inline: true },
            { name: "Disk Usage", value: `${systemStats.disk_usage}%`, inline: true }
          )
          .setFooter({ text: "System Stats", iconURL: client.user.displayAvatarURL() })
          .setTimestamp();

        await interaction.followUp({ embeds: [embed] });
      } else {
        await interaction.followUp("**Failed to retrieve system statistics.**");
      }
    } catch (error) {
      console.error(`Error while getting system stats:`, error.message);
      await interaction.followUp("**An error occurred while fetching the system statistics.**");
    }
  }

  if (interaction.commandName === "getinbounds") {
    await interaction.deferReply();

    try {
      const inbounds = await marzban.system.getInbounds();
      if (inbounds) {
        const embed = new EmbedBuilder()
          .setColor("#e74c3c")
          .setTitle("🔑 System Inbounds")
          .addFields(
            { name: "Inbounds Information", value: JSON.stringify(inbounds, null, 2), inline: false }
          )
          .setFooter({ text: "Inbounds Info", iconURL: client.user.displayAvatarURL() })
          .setTimestamp();

        await interaction.followUp({ embeds: [embed] });
      } else {
        await interaction.followUp("**Failed to retrieve inbounds information.**");
      }
    } catch (error) {
      console.error(`Error while getting inbounds:`, error.message);
      await interaction.followUp("**An error occurred while fetching the inbounds information.**");
    }
  }

  if (interaction.commandName === "gethosts") {
    await interaction.deferReply();

    try {
      const hosts = await marzban.system.getHosts();
      if (hosts) {
        const embed = new EmbedBuilder()
          .setColor("#3498db")
          .setTitle("🌐 System Hosts")
          .addFields(
            { name: "Hosts Information", value: JSON.stringify(hosts, null, 2), inline: false }
          )
          .setFooter({ text: "Hosts Info", iconURL: client.user.displayAvatarURL() })
          .setTimestamp();

        await interaction.followUp({ embeds: [embed] });
      } else {
        await interaction.followUp("**Failed to retrieve hosts information.**");
      }
    } catch (error) {
      console.error(`Error while getting hosts:`, error.message);
      await interaction.followUp("**An error occurred while fetching the hosts information.**");
    }
  }


  if (interaction.commandName === "help") {
    await interaction.deferReply();
    const categories = {
      "🔹 مدیریت کاربران": [
        { name: "/getuser", description: "دریافت اطلاعات کاربر" },
        { name: "/getusage", description: "بررسی میزان مصرف کاربر" },
        { name: "/resetusage", description: "ریست کردن مصرف کاربر" },
      ],
      "🔹 مدیریت ادمین‌ها": [
        { name: "/getadmins", description: "نمایش لیست ادمین‌ها" },
        { name: "/createadmin", description: "ایجاد ادمین جدید" },
        { name: "/removeadmin", description: "حذف ادمین" },
      ],
      "🔹 آمار و وضعیت سرور": [
        { name: "/getstats", description: "دریافت وضعیت کلی سیستم" },
        { name: "/getinbounds", description: "مشاهده ورودی‌های سرور" },
        { name: "/gethosts", description: "دریافت لیست هاست‌ها" },
      ],
      "🔹 کاربران منقضی شده": [
        { name: "/getexpired", description: "لیست کاربران منقضی شده" },
        { name: "/deleteexpired", description: "حذف کاربران منقضی شده" },
      ],
      "🔹  کانفیگ": [
        { name: "/createconfig", description: "ساخت کانفیگ" },
        { name: "/removeuser", description: "حذف کانفیگ" },
      ],
    };

    const embed = new EmbedBuilder()
      .setColor("#3498db")
      .setTitle("📜 راهنمای دستورات بات")
      .setDescription("🔹 لیست تمامی دستورات قابل استفاده در این بات:")
      .setThumbnail(client.user.displayAvatarURL())
      .setFooter({ text: "برای دریافت راهنمایی بیشتر روی دکمه زیر کلیک کنید", iconURL: client.user.displayAvatarURL() })
      .setTimestamp();
    for (const [category, commands] of Object.entries(categories)) {
      embed.addFields({
        name: category,
        value: commands.map(cmd => `**${cmd.name}** - ${cmd.description}`).join("\n"),
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



  if (interaction.commandName === "getuser") {
    await interaction.deferReply();

    const username = interaction.options.getString("username");

    try {
      const response = await marzban.user.getUser(username);
      if (response) {
        const embed = new EmbedBuilder()
          .setColor("#3498db")
          .setTitle("📄 User Information")
          .setDescription(`**Username:** \`${response.username}\`\n**Status:** \`${response.status}\`\n**Note:** \`${response.note || "No note"}\`\n**Data Limit:** \`${response.data_limit || "No limit"}\`\n**Expire:** \`${response.expire || "No expiration"}\``)
          .setFooter({ text: "Toonel", iconURL: client.user.displayAvatarURL() })
          .setTimestamp();

        await interaction.followUp({ embeds: [embed] });
      } else {
        await interaction.followUp("⚠ **User not found.**");
      }
    } catch (error) {
      console.error("Error retrieving user information:", error.message);
      await interaction.followUp("**An error while fetching user information.**");
    }
  }







});




const LOG_CHANNEL_ID = '1352425824732577886';
// const db = new Database('./vpn_configs.db');


// db.prepare(`
//   CREATE TABLE IF NOT EXISTS configs (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     user_id TEXT NOT NULL,
//     username TEXT NOT NULL,
//     size INTEGER,
//     created_at TEXT,
//     config_links TEXT
//   )
//   `).run();



client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand() && interaction.commandName === "vpn") {
    const embed = new EmbedBuilder()
      .setTitle("فروش VPN")
      .setDescription("برای خرید VPN یکی از پلن‌ها رو انتخاب کن.")
      .setColor("#00bfff");

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("buy_vpn")
          .setLabel("خرید VPN")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("my_configs")
          .setLabel("کانفیگ‌های من")
          .setStyle(ButtonStyle.Secondary)
      );
    return interaction.reply({ embeds: [embed], components: [row] });
  }

  if (interaction.isButton() && interaction.customId === "buy_vpn") {
    const menu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("select_vpn")
        .setPlaceholder("یکی از پلن‌ها رو انتخاب کن")
        .addOptions([
          { label: "12GB", description: "100", value: "plan_12gb" },
          { label: "24GB", description: "150", value: "plan_24gb" },
          { label: "50GB", description: "250", value: "plan_50gb" },
        ])
    );

    return interaction.reply({ content: "یکی از پلن‌ها رو انتخاب کن:", components: [menu], ephemeral: true });
  }
  const allowedCloserIds = [
    '473200942557167626',
    '123201277806116865',
    '738810685219143689',
    '260482864972300289'
  ];

  if (interaction.customId === "my_configs") {
    const rows = db.prepare(`
      SELECT id, username, size FROM configs WHERE user_id = ?
    `).all(interaction.user.id);
  
    if (rows.length === 0) {
      return interaction.reply({ content: "شما هیچ کانفیگ فعالی ندارید.", ephemeral: true });
    }
  
    const menu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("select_config")
        .setPlaceholder("یکی از کانفیگ‌هات رو انتخاب کن")
        .addOptions(
          rows.map(row => ({
            label: `${row.username} (${row.size}GB)`,
            value: String(row.id)
          }))
        )
    );
  
    return interaction.reply({ content: "کانفیگ موردنظر رو انتخاب کن:", components: [menu], ephemeral: true });
  }
  if (interaction.customId === "select_config") {
    const configId = interaction.values[0];
  
    const config = db.prepare(`
      SELECT * FROM configs WHERE id = ?
    `).get(configId);
  
    if (!config) {
      return interaction.reply({ content: "کانفیگ پیدا نشد!", ephemeral: true });
    }
  
    const embed = new EmbedBuilder()
      .setTitle("📦 مشخصات کانفیگ")
      .addFields(
        { name: "نام کاربری", value: `\`${config.username}\`` },
        { name: "حجم", value: `${config.size}GB` },
        { name: "تاریخ ایجاد", value: config.created_at }
      )
      .setDescription(config.config_links)
      .setColor("#00cec9");
  
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
  
  if (interaction.isStringSelectMenu() && interaction.customId === "select_vpn") {
    const plan = interaction.values[0];
    const username = `${interaction.user.username}_${Date.now()}`;
    const planSize = {
      plan_12gb: 12,
      plan_24gb: 24,
      plan_50gb: 50,
    };
    const size = planSize[plan];
  
    const channel = await interaction.guild.channels.create({
      name: `vpn-${interaction.user.username}`,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel],
        },
        {
          id: interaction.user.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.AttachFiles
          ],
        },
      ],
    });
  
    const embed = new EmbedBuilder()
      .setColor("#f1c40f")
      .setTitle("پرداخت VPN")
      .setDescription(`برای خرید VPN ${size} گیگ، مبلغ را به شماره کارت زیر واریز کرده و عکس رسید را ارسال کنید:\n\n**شماره کارت:** \`111111111\``)
      .setFooter({ text: "در انتظار تایید پرداخت..." });
  
    const closeButton = new ButtonBuilder()
      .setCustomId("close_ticket")
      .setLabel("Close")
      .setStyle(ButtonStyle.Danger);
  
    const row = new ActionRowBuilder().addComponents(closeButton);
  
    await channel.send({
      content: `<@${interaction.user.id}>`,
      embeds: [embed],
      components: [row]
    });
  
    const collector = channel.createMessageComponentCollector({
      filter: i => i.customId === "close_ticket",
    });
  

    
    collector.on("collect", async i => {
      if (!allowedCloserIds.includes(String(i.user.id))) {
        return i.reply({ content: "شما اجازه بستن این تیکت را ندارید.", ephemeral: true });
      }
    
      await channel.setName(`closed-${channel.name}`);
    
      await channel.permissionOverwrites.edit(interaction.user.id, {
        ViewChannel: false,
      });
    
      await i.reply({ content: "تیکت با موفقیت بسته شد.", ephemeral: true });
    
      const logChannelId = '1352425824732577886'; 
      const logChannel = interaction.guild.channels.cache.get(logChannelId);
    
      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setColor("#ff4757")
          .setTitle("🎟️ تیکت بسته شد")
          .setThumbnail(i.user.displayAvatarURL({ dynamic: true }))
          .addFields(
            { name: "📌 بسته شده توسط", value: `<@${i.user.id}>`, inline: true },
            { name: "👤 کاربر تیکت", value: `<@${interaction.user.id}>`, inline: true },
            { name: "📁 کانال تیکت", value: `#${channel.name}`, inline: false }
          )
          .setTimestamp()
          .setFooter({ text: `Toonel Bot`, iconURL: interaction.client.user.displayAvatarURL() });
    
        await logChannel.send({ embeds: [logEmbed] });
      }
    
      collector.stop();
    });


    const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
    if (logChannel) {
      const logEmbed = new EmbedBuilder()
        .setColor("#1e90ff")
        .setTitle("📥 درخواست خرید VPN جدید")
        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: "کاربر", value: `<@${interaction.user.id}>`, inline: true },
          { name: "پلن انتخابی", value: `${size} گیگابایت`, inline: true },
          { name: "نام کاربری", value: `\`${username}\``, inline: true },
          { name: "چنل پرداخت", value: `<#${channel.id}>`, inline: false }
        )
        .setFooter({ text: "Toonel Bot", iconURL: client.user.displayAvatarURL() })
        .setTimestamp();

      await logChannel.send({
        embeds: [logEmbed],
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`approve|${username}|${size}|${channel.id}`)
              .setLabel("تأیید پرداخت")
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId(`decline|${username}|${channel.id}`)
              .setLabel("عدم تأیید")
              .setStyle(ButtonStyle.Danger)
          )
        ]
      });
    }

    return interaction.reply({
      content: `✅ چنل پرداخت ساخته شد: <#${channel.id}>`,
      ephemeral: true,
    });
  }

  if (interaction.isButton()) {
    const parts = interaction.customId.split("|");
    const action = parts[0];

    if (action === "approve") {
      const [_, username, sizeInput, channelId] = parts;

      const sizeInGB = parseInt(sizeInput);
      const dataLimit = !isNaN(sizeInGB) ? sizeInGB * 1024 * 1024 * 1024 : 0;

      if (sizeInput && isNaN(sizeInGB)) {
        return interaction.reply({ content: "خطا: پلن انتخابی معتبر نیست.", ephemeral: true });
      }

      const userData = {
        status: "active",
        username,
        note: "Created using Discord Bot",
        proxies: { vless: {} },
        data_limit: dataLimit,
        expire: 0,
        data_limit_reset_strategy: "no_reset",
        inbounds: { vless: ["Vless"] },
      };

      try {
        await marzban.user.addUser(userData);
        const userInfo = await marzban.user.getUser(username);
        const configLinks = userInfo.links
        .map((link, index) => `**Config ${index + 1}:**\n\u0060\u0060\u0060${link}\u0060\u0060\u0060`)
          .join("\n");

        const embed = new EmbedBuilder()
          .setColor("#00b894")
          .setTitle("✅ VPN شما آماده است")
          .setDescription(`**نام کاربری:** \`${username}\`\n**حجم:** ${sizeInGB || "نامحدود"} گیگ\n\n${configLinks}`)
          .setTimestamp();

        const targetChannel = interaction.guild.channels.cache.get(channelId);
        if (targetChannel) await targetChannel.send({ embeds: [embed] });
        else console.error(`❌ Channel not found: ${channelId}`);

        return interaction.reply({ content: `کانفیگ برای \`${username}\` ساخته شد.`, ephemeral: true });

      } catch (error) {
        console.error("❌ خطا هنگام ساخت کاربر یا گرفتن لینک:", error);
        const errorEmbed = new EmbedBuilder()
          .setColor("#e74c3c")
          .setTitle("خطا در ساخت VPN")
          .setDescription("در هنگام ساخت کانفیگ VPN مشکلی پیش اومد. لطفاً بعداً دوباره تلاش کن یا با ادمین تماس بگیر.")
          .setTimestamp();

        return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }

    if (action === "decline") {
      const [_, username, channelId] = parts;

      const modal = new ModalBuilder()
        .setCustomId(`declineReason|${username}|${channelId}`)
        .setTitle("دلیل عدم تایید");

      const reasonInput = new TextInputBuilder()
        .setCustomId("reason")
        .setLabel("دلیل رد سفارش")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));
      return interaction.showModal(modal);
    }
  }

  if (interaction.isModalSubmit() && interaction.customId.startsWith("declineReason|")) {
    const [_, username, channelId] = interaction.customId.split("|");
    const reason = interaction.fields.getTextInputValue("reason");

    const embed = new EmbedBuilder()
      .setColor("#e74c3c")
      .setTitle("سفارش شما رد شد")
      .setDescription(`کاربر گرامی، سفارش شما برای VPN با نام کاربری \`${username}\` رد شد.\n\n**دلیل:**\n${reason}`)
      .setTimestamp();

    const targetChannel = interaction.guild.channels.cache.get(channelId);
    if (targetChannel) {
      await targetChannel.send({ embeds: [embed] });
      return interaction.reply({ content: "دلیل رد سفارش ارسال شد.", ephemeral: true });
    } else {
      console.error(`❌ Channel not found in declineReason: ${channelId}`);
      return interaction.reply({ content: "چنل پیدا نشد!", ephemeral: true });
    }
  }
});



///////////////////////////////////////////////////////////////////////////////////////////





function addUserIdToFile(userId) {
  const allowedUserIds = getAllowedUserIds();
  if (!allowedUserIds.includes(userId)) {
    allowedUserIds.push(userId);
    fs.writeFileSync(filePath, JSON.stringify({ allowedUserIds }, null, 2));
  }
}

function removeUserIdFromFile(userId) {
  let allowedUserIds = getAllowedUserIds();
  allowedUserIds = allowedUserIds.filter(id => id !== userId);
  fs.writeFileSync(filePath, JSON.stringify({ allowedUserIds }, null, 2));
}





client.login(".Gaew4x.");