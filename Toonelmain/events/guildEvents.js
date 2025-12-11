const { EmbedBuilder, WebhookClient, Events , Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle} = require("discord.js");

const LOG_CHANNEL_ID = "1352672714757902409";

module.exports = (client) => {
    client.on(Events.GuildCreate, async (guild) => {
        try {
            const channel = guild.systemChannel || guild.channels.cache.find(
                ch => ch.type === 0 && ch.permissionsFor(guild.members.me).has("SendMessages")
            );
            
            if (!channel) {
                console.log(`heeeeey`);
                return;
            }

            await channel.sendTyping();
            await new Promise(resolve => setTimeout(resolve, 1500));

            const embed = new EmbedBuilder()
                .setTitle("✨ بات با موفقیت اضافه شد!")
                .setDescription(`سلام به سرور **${guild.name}** 👋\nممنون که منو اضافه کردی! 🤖\n\nبرای دیدن لیست دستورات از \`/help\` استفاده کن.\nاگه سوالی داشتی، روی دکمه‌های زیر کلیک کن!`)
                .setColor("#00C896")
                .setThumbnail(client.user.displayAvatarURL())
                .setFooter({ text: "از استفاده از من لذت ببرید! 🚀", iconURL: client.user.displayAvatarURL() })
                .setTimestamp();

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel("📜 راهنمای بات")
                    .setStyle(ButtonStyle.Primary)
                    .setCustomId("help_command"),
                new ButtonBuilder()
                    .setLabel("📞 پشتیبانی")
                    .setStyle(ButtonStyle.Link)
                    .setURL("https://discord.gg/"),
                new ButtonBuilder()
                    .setLabel("➕ اضافه کردن من به سرور")
                    .setStyle(ButtonStyle.Link)
                    .setURL(`https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`)
            );

            await channel.send({ embeds: [embed], components: [row] });
        } catch (error) {
            console.error(`haji kharesho giidam ${guild.name}`, error.message);
        }
        
        client.on('interactionCreate', async (interaction) => {
            if (!interaction.isButton()) return;
        
            if (interaction.customId === 'help_command') {
                const categories = {
                    "📊 آمار و وضعیت": [
                        { name: "/botinfo", description: "📌 دریافت وضعیت کلی بات" },
                        { name: "/ipinfo", description: "🌍 مشاهده وضعیت IP" },
                        { name: "/checkport", description: "🔍 بررسی پورت" },
                    ],
                    "⚙️ کانفیگ": [
                        { name: "/createconfig", description: "🛠️ ساخت کانفیگ" },
                    ],
                };
        
                const embed = new EmbedBuilder()
                    .setColor('#2F3136')
                    .setTitle("📜 راهنمای دستورات بات")
                    .setDescription("🔹 لیست تمامی دستورات قابل استفاده در این بات:")
                    .setThumbnail(client.user.displayAvatarURL())
                    .setFooter({ text: "برای کمک بیشتر می‌توانید از پشتیبانی استفاده کنید.", iconURL: client.user.displayAvatarURL() })
                    .setTimestamp();        
                for (const [category, commands] of Object.entries(categories)) {
                    embed.addFields({
                        name: category,
                        value: commands.map(cmd => `**${cmd.name}** - ${cmd.description}`).join("\n"),
                        inline: false,
                    });
                }
        
                await interaction.reply({ embeds: [embed], ephemeral: true });
            }
        });


        const logChannel = await client.channels.fetch(LOG_CHANNEL_ID);
        if (logChannel) {
            const owner = await guild.fetchOwner();
            const logEmbed = new EmbedBuilder()
                .setTitle("✅ Bot Added to a New Server!")
                .setDescription(`🔹 The bot has been added to a new server.`)
                .setColor("Green")
                .addFields(
                    { name: "📌 Server Name", value: `\`${guild.name}\``, inline: true },
                    { name: "🆔 Server ID", value: `\`${guild.id}\``, inline: true },
                    { name: "👑 Server Owner", value: `<@${owner.id}>`, inline: true },
                    { name: "👥 Member Count", value: `\`${guild.memberCount}\` members`, inline: true },
                    { name: "📅 Server Created", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: true }
                )
                .setThumbnail(guild.iconURL({ dynamic: true }) || client.user.displayAvatarURL())
                .setFooter({ text: `Total Servers: ${client.guilds.cache.size}`, iconURL: client.user.displayAvatarURL() })
                .setTimestamp();

            await logChannel.send({ embeds: [logEmbed] });
        }
    });

    client.on(Events.GuildDelete, async (guild) => {
        const logChannel = await client.channels.fetch(LOG_CHANNEL_ID);
        if (logChannel) {
            const logEmbed = new EmbedBuilder()
                .setTitle("❌ Bot Removed from a Server!")
                .setDescription(`🔹 The bot has been removed from a server.`)
                .setColor("Red")
                .addFields(
                    { name: "📌 Server Name", value: `\`${guild.name}\``, inline: true },
                    { name: "🆔 Server ID", value: `\`${guild.id}\``, inline: true },
                    { name: "👥 Members Before Removal", value: `\`${guild.memberCount}\` members`, inline: true }
                )
                .setThumbnail(guild.iconURL({ dynamic: true }) || client.user.displayAvatarURL())
                .setFooter({ text: `Total Servers: ${client.guilds.cache.size}`, iconURL: client.user.displayAvatarURL() })
                .setTimestamp();

            await logChannel.send({ embeds: [logEmbed] });
        }
    });
};