const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help-roles')
        .setDescription('Hilfe für Rollen-Management Commands'),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor(0x2b2d31)
            .setTitle('🛠️ Rollen-Management Hilfe')
            .setDescription('Verfügbare Commands für Selfrole-Verwaltung:')
            .addFields(
                {
                    name: '🎭 `/roles-editor add`',
                    value: 'Fügt eine neue Selfrole-Rolle hinzu\n`emoji:` 🎀\n`rolle:` @TikTok\n`beschreibung:` (optional)',
                    inline: true
                },
                {
                    name: '🗑️ `/roles-editor remove`',
                    value: 'Entfernt eine Selfrole-Rolle\n`emoji:` 🎀',
                    inline: true
                },
                {
                    name: '✏️ `/roles-editor edit`',
                    value: 'Bearbeitet eine existierende Rolle\n`emoji:` 🎀',
                    inline: true
                },
                {
                    name: '📋 `/roles-editor list`',
                    value: 'Zeigt alle konfigurierten Rollen an',
                    inline: true
                },
                {
                    name: '🔄 `/roles-editor replace`',
                    value: 'Ersetzt eine Rolle durch eine andere\n`emoji:` 🎀\n`neue-rolle:` @TikTok',
                    inline: true
                },
                {
                    name: '⚡ `/roles-editor reload`',
                    value: 'Lädt die Selfrole-Nachricht neu',
                    inline: true
                },
                {
                    name: '📚 Beispiel für Rollen-Ersetzung',
                    value: '```/roles-editor replace emoji:🎀 neue-rolle:@TikTok```\nErsetzt die alte TikTok-Moderator Rolle durch eine neue TikTok Rolle',
                    inline: false
                }
            )
            .setFooter({ text: 'ShortSystem Bot • Vollständiges Rollen-Management' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};