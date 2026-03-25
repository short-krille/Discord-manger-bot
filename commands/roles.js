const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roles')
        .setDescription('Zeigt alle Selfrole-Rollen an'),

    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });
            
            const roles = interaction.guild.roles.cache
                .filter(role => 
                    ['news', 'stream', 'minecraft', 'giveaway', 'partner', 'tiktok']
                    .some(name => role.name.toLowerCase().includes(name.toLowerCase()))
                )
                .sort((a, b) => a.position - b.position);
            
            if (roles.size === 0) {
                return interaction.editReply({
                    content: '❌ Keine Selfrole-Rollen gefunden. Bitte erstelle zuerst die Rollen.',
                    ephemeral: true
                });
            }
            
            const embed = new EmbedBuilder()
                .setColor(0x2b2d31)
                .setTitle('🎭 Verfügbare Selfrole-Rollen')
                .setDescription('Diese Rollen können durch Reactions erhalten werden:')
                .addFields(
                    {
                        name: 'Rollen:',
                        value: roles.map(role => `• ${role} (${role.name})`).join('\n'),
                        inline: false
                    },
                    {
                        name: 'Emoji-Zuordnung:',
                        value: '📰 → News\n🎥 → Stream\n🌱 → Minecraft\n🎉 → Giveaway\n🤝 → Partner\n🎀 → TikTok',
                        inline: true
                    }
                )
                .setFooter({ text: 'Klicke auf die Emojis unter der Selfrole-Nachricht' });
            
            await interaction.editReply({ embeds: [embed], ephemeral: true });
            
        } catch (error) {
            console.error('Fehler in /roles:', error);
            await interaction.editReply({
                content: '❌ Fehler beim Abrufen der Rollen.',
                ephemeral: true
            });
        }
    }
};