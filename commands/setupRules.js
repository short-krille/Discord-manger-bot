const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-rules')
        .setDescription('Regel-Channel festlegen')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false)
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel für das Regelwerk')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)),

    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });
            
            const channel = interaction.options.getChannel('channel');
            
            // Hier speicherst du die Channel-ID (z.B. in einer JSON Datei)
            const fs = require('fs');
            const path = require('path');
            const configPath = path.join(__dirname, '../config/config.json');
            
            let config = {};
            if (fs.existsSync(configPath)) {
                config = require(configPath);
            }
            
            const guildId = interaction.guild.id;
            if (!config[guildId]) config[guildId] = {};
            
            config[guildId].rulesChannel = channel.id;
            
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
            
            // Regelwerk Embed erstellen
            const rulesEmbed = new EmbedBuilder()
                .setColor(0x2b2d31)
                .setTitle('DISCORD REGELN')
                .setDescription('Bitte lese und befolge unsere Regeln, um ein angenehmes Miteinander zu gewährleisten.')
                .addFields(
                    { name: '§1.1 Beleidigungen / Schimpfwörter', value: 'Beleidigungen, diskriminierende Äußerungen und Schimpfwörter sind strengstens untersagt.', inline: false },
                    { name: '§1.2 Avatare / Nicknamen', value: 'Avatare und Nicknamen dürfen nicht anstößig, beleidigend oder NSFW sein.', inline: false },
                    { name: '§2.1 Freundlicher Umgang', value: 'Behandle alle Mitglieder mit Respekt. Toxisches Verhalten wird nicht toleriert.', inline: false },
                    { name: '§2.2 Adminrechte', value: 'Missbrauche keine Adminrechte. Entscheidungen des Teams sind zu akzeptieren.', inline: false },
                    { name: '§3.1 Anweisungen der Admins', value: 'Folge den Anweisungen des Admin-Teams. Bei Fragen wende dich vertrauensvoll an uns.', inline: false },
                    { name: '§3.2 Regelverstöße melden', value: 'Melde Regelverstöße umgehend einem Teammitglied. Nicht selbst eskaliert werden.', inline: false },
                    { name: '§4 Community-Verhalten', value: 'Trage zu einer positiven Community bei. Spam, Werbung und Streit sind zu unterlassen.', inline: false }
                )
                .setFooter({ text: 'Mit einem Klick auf ✅ bestätigst du, die Regeln gelesen und verstanden zu haben.' })
                .setTimestamp();
            
            // Embed in den ausgewählten Channel senden
            await channel.send({ embeds: [rulesEmbed] })
                .then(async message => {
                    await message.react('✅');
                    
                    await interaction.editReply({
                        content: `✅ Regelwerk erfolgreich in ${channel} eingerichtet!`,
                        ephemeral: true
                    });
                })
                .catch(async error => {
                    console.error('Fehler beim Senden der Regeln:', error);
                    await interaction.editReply({
                        content: `❌ Fehler beim Senden der Regeln: ${error.message}`,
                        ephemeral: true
                    });
                });
            
        } catch (error) {
            console.error('Fehler in setup-rules:', error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({
                    content: `❌ Fehler: ${error.message}`,
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    content: `❌ Fehler: ${error.message}`,
                    ephemeral: true
                });
            }
        }
    }
};