const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Setup Hilfe für Regelwerk und Selfroles')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false),

    async execute(interaction) {
        console.log('🔧 /setup Command ausgeführt');
        
        try {
            await interaction.deferReply({ ephemeral: true });
            
            const helpEmbed = new EmbedBuilder()
                .setColor(0x2b2d31)
                .setTitle('⚙️ Bot Setup - Einrichtungsanleitung')
                .setDescription('Verwende folgende Commands um den Bot vollständig einzurichten:')
                .addFields(
                    {
                        name: '📜 **Schritt 1: Regelwerk einrichten**',
                        value: '```/setup-rules channel:#dein-regel-channel```\nErstellt das Regelwerk im ausgewählten Channel mit ✅ Reaction.',
                        inline: false
                    },
                    {
                        name: '🔔 **Schritt 2: Selfroles einrichten**',
                        value: '```/setup-selfroles channel:#dein-selfrole-channel```\nErstellt Reaction-Roles für: 📰 News, 🎥 Stream, 🌱 Minecraft, 🎉 Giveaway, 🤝 Partner, 🎀 TikTok',
                        inline: false
                    },
                    {
                        name: '⚡ **Schnelleinrichtung**',
                        value: '1. Rollen erstellen: `@news`, `@stream`, `@minecraft`, `@giveaway`, `@partner`, `@tiktok`\n2. Bot über diese Rollen positionieren\n3. Commands ausführen',
                        inline: false
                    }
                )
                .setFooter({ text: 'ShortSystem Bot • Einfache Konfiguration' })
                .setTimestamp();

            await interaction.editReply({
                embeds: [helpEmbed],
                ephemeral: true
            });
            
            console.log('✅ Setup Hilfe erfolgreich gesendet');
            
        } catch (error) {
            console.error('💥 Fehler in /setup:', error);
            
            const errorMessage = error.message.length > 100 ? error.message.substring(0, 100) + '...' : error.message;
            
            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ 
                        content: `❌ Fehler: ${errorMessage}`,
                        ephemeral: true 
                    });
                } else {
                    await interaction.reply({ 
                        content: `❌ Fehler: ${errorMessage}`,
                        ephemeral: true 
                    });
                }
            } catch (replyError) {
                console.error('❌ Konnte Fehler nicht senden:', replyError);
            }
        }
    }
};