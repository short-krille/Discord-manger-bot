const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-selfroles')
        .setDescription('Selfrole-System einrichten')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false)
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel für Selfrole-Nachricht')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText))
        .addRoleOption(option => option.setName('news').setDescription('Rolle für News').setRequired(false))
        .addRoleOption(option => option.setName('stream').setDescription('Rolle für Stream Ankündigungen').setRequired(false))
        .addRoleOption(option => option.setName('minecraft').setDescription('Rolle für Minecraft Updates').setRequired(false))
        .addRoleOption(option => option.setName('giveaway').setDescription('Rolle für Giveaways').setRequired(false))
        .addRoleOption(option => option.setName('partner').setDescription('Rolle für Partner Benachrichtigungen').setRequired(false))
        .addRoleOption(option => option.setName('tiktok').setDescription('Rolle für TikTok/Socials').setRequired(false)),

    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const channel = interaction.options.getChannel('channel');

            // Standard-Rollen Konfiguration (für Emojis und Beschreibungen)
            const defaultRoles = [
                { key: 'news', emoji: '📰', description: 'Erhalte Neuigkeiten und Updates' },
                { key: 'stream', emoji: '🎥', description: 'Werde über Streams benachrichtigt' },
                { key: 'minecraft', emoji: '🌱', description: 'Bleibe über Minecraft informiert' },
                { key: 'giveaway', emoji: '🎉', description: 'Verpasse keine Gewinnspiele' },
                { key: 'partner', emoji: '🤝', description: 'Erfahre von Partnerschaften' },
                { key: 'tiktok', emoji: '🎀', description: 'Bleibe bei TikTok-Updates auf dem Laufenden' }
            ];

            // Suche nach existierenden Rollen
            const roleMapping = {};
            const emojiRoleMap = {};

            for (const roleDef of defaultRoles) {
                const role = interaction.options.getRole(roleDef.key);

                if (role) {
                    roleMapping[roleDef.key] = {
                        id: role.id,
                        name: role.name,
                        emoji: roleDef.emoji,
                        description: roleDef.description
                    };
                    emojiRoleMap[roleDef.emoji] = roleDef.key;
                    console.log(`✅ Rolle konfiguriert: ${roleDef.key} → ${role.name}`);
                }
            }

            if (Object.keys(roleMapping).length === 0) {
                return interaction.editReply({
                    content: '❌ Keine Rollen ausgewählt! Bitte wähle mindestens eine Rolle aus.',
                    ephemeral: true
                });
            }

            // Erstelle das Selfrole-Embed
            const roles = Object.values(roleMapping);

            const selfroleEmbed = new EmbedBuilder()
                .setColor(0x2b2d31)
                .setTitle('🎭 Selfrole System')
                .setDescription('Reagiere mit den Emojis unten, um dir selbst Rollen zu geben oder zu entfernen!')
                .addFields(
                    {
                        name: 'Verfügbare Rollen:',
                        value: roles.map(role => {
                            return `${role.emoji} **${role.name}**\n${role.description}\n`;
                        }).join('\n'),
                        inline: false
                    }
                )
                .addFields(
                    {
                        name: 'So funktioniert es:',
                        value: '1. Klicke auf ein Emoji unten um die Rolle zu erhalten\n2. Klicke erneut auf das Emoji um die Rolle zu entfernen\n3. Du erhälst eine DM-Bestätigung',
                        inline: false
                    }
                )
                .setFooter({ text: `ShortSystem Bot • ${roles.length} Rollen verfügbar` })
                .setTimestamp();

            // Sende die Nachricht
            const message = await channel.send({ embeds: [selfroleEmbed] });

            // Füge Reactions hinzu
            for (const role of roles) {
                await message.react(role.emoji);
            }

            // Config speichern
            const configPath = path.join(__dirname, '../config/config.json');
            let config = { guildConfigs: {} };

            if (fs.existsSync(configPath)) {
                try {
                    config = require(configPath);
                } catch (e) { console.error('Error loading config:', e); }
            }
            if (!config.guildConfigs) config.guildConfigs = {};

            const guildId = interaction.guild.id;
            if (!config.guildConfigs[guildId]) {
                config.guildConfigs[guildId] = {};
            }

            // Convert roleMapping to array for reaction handler compatibility
            const selfrolesArray = Object.values(roleMapping).map(r => ({
                emoji: r.emoji,
                roleId: r.id,
                name: r.name,
                description: r.description
            }));

            // Speichere die Konfiguration
            config.guildConfigs[guildId].selfroleChannel = channel.id;
            config.guildConfigs[guildId].selfroleMessageId = message.id;
            config.guildConfigs[guildId].selfroles = selfrolesArray;

            // Speichere Config
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

            console.log(`✅ Selfrole-System eingerichtet für Guild: ${guildId}`);
            console.log(`📝 Config gespeichert mit ${Object.keys(roleMapping).length} Rollen`);

            // Erfolgsmeldung
            const successEmbed = new EmbedBuilder()
                .setColor(0x57f287)
                .setTitle('✅ Selfrole-System erfolgreich eingerichtet!')
                .setDescription(`Das Selfrole-System wurde in ${channel} aktiviert.`)
                .addFields(
                    {
                        name: 'Konfigurierte Rollen:',
                        value: roles.map(role => `${role.emoji} ${role.name}`).join('\n'),
                        inline: true
                    },
                    {
                        name: 'Nachrichten-ID:',
                        value: message.id,
                        inline: true
                    }
                )
                .setFooter({ text: 'Nutze /roles-editor um Rollen zu bearbeiten' })
                .setTimestamp();

            await interaction.editReply({
                embeds: [successEmbed],
                ephemeral: true
            });

        } catch (error) {
            console.error('Fehler in setup-selfroles:', error);
            await interaction.editReply({
                content: `❌ Fehler: ${error.message}`,
                ephemeral: true
            });
        }
    }
};