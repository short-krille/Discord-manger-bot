const { 
    SlashCommandBuilder, 
    PermissionFlagsBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roles-editor')
        .setDescription('Selfrole-Rollen bearbeiten und ersetzen')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false),

    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const guildId = interaction.guild.id;
            const configPath = path.join(__dirname, '../config/config.json');

            // Config laden
            let config = {};
            if (fs.existsSync(configPath)) {
                config = require(configPath);
            }

            if (!config[guildId] || !config[guildId].selfroleMessageId) {
                return interaction.editReply({
                    content: '❌ Selfrole-System ist nicht eingerichtet. Bitte erst `/setup-selfroles` verwenden.',
                    ephemeral: true
                });
            }

            const guildConfig = config[guildId];
            
            if (!guildConfig.selfroleRoles || Object.keys(guildConfig.selfroleRoles).length === 0) {
                return interaction.editReply({
                    content: '❌ Keine Selfrole-Rollen konfiguriert! Bitte erst `/setup-selfroles` verwenden.',
                    ephemeral: true
                });
            }

            // Zeige das Haupt-Menü an
            await showMainMenu(interaction, guildConfig);

        } catch (error) {
            console.error('Fehler in roles-editor:', error);
            await interaction.editReply({
                content: `❌ Fehler: ${error.message}`,
                ephemeral: true
            });
        }
    }
};

// Haupt-Menü anzeigen
async function showMainMenu(interaction, guildConfig) {
    const roles = Object.values(guildConfig.selfroleRoles);
    
    // Erstelle das Haupt-Embed
    const embed = new EmbedBuilder()
        .setColor(0x2b2d31)
        .setTitle('🛠️ Rollen-Editor')
        .setDescription('Verwalte alle Selfrole-Rollen. Wähle eine Aktion aus:')
        .addFields(
            {
                name: '📋 Aktuelle Selfrole-Rollen:',
                value: roles.map((role, index) => 
                    `${index + 1}. ${role.emoji} **${role.name}**\n   📝 ${role.description || 'Keine Beschreibung'}`
                ).join('\n\n'),
                inline: false
            }
        )
        .setFooter({ text: `Insgesamt ${roles.length} Rollen konfiguriert` })
        .setTimestamp();

    // Aktions-Buttons
    const actionRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('replace_role')
                .setLabel('🔄 Rolle ersetzen')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🔄'),
            new ButtonBuilder()
                .setCustomId('edit_role')
                .setLabel('✏️ Rolle bearbeiten')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('✏️')
        );

    const actionRow2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('delete_role')
                .setLabel('🗑️ Rolle löschen')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🗑️'),
            new ButtonBuilder()
                .setCustomId('refresh_list')
                .setLabel('🔄 Aktualisieren')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('🔄'),
            new ButtonBuilder()
                .setCustomId('close_menu')
                .setLabel('❌ Schließen')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('❌')
        );

    const response = await interaction.editReply({
        embeds: [embed],
        components: [actionRow, actionRow2],
        ephemeral: true
    });

    // Button Collector
    const collector = response.createMessageComponentCollector({ 
        filter: i => i.user.id === interaction.user.id,
        time: 300000 // 5 Minuten
    });

    collector.on('collect', async i => {
        await i.deferUpdate();
        
        switch (i.customId) {
            case 'replace_role':
                await showReplaceRoleMenu(i, interaction, guildConfig);
                break;
            case 'edit_role':
                await showEditRoleMenu(i, interaction, guildConfig);
                break;
            case 'delete_role':
                await showDeleteRoleMenu(i, interaction, guildConfig);
                break;
            case 'refresh_list':
                await showMainMenu(interaction, guildConfig);
                break;
            case 'close_menu':
                await interaction.deleteReply();
                collector.stop();
                break;
        }
    });
}

// Menü: Rolle ersetzen
async function showReplaceRoleMenu(interaction, originalInteraction, guildConfig) {
    const roles = Object.values(guildConfig.selfroleRoles);
    
    // Erstelle Auswahl-Menü für "Welche Rolle ersetzen?"
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('select_role_to_replace')
        .setPlaceholder('Wähle die zu ersetzende Rolle...')
        .addOptions(
            roles.map(role => ({
                label: role.name.substring(0, 100),
                description: `Emoji: ${role.emoji}`,
                value: role.id,
                emoji: role.emoji
            }))
        );

    const actionRow = new ActionRowBuilder().addComponents(selectMenu);

    const embed = new EmbedBuilder()
        .setColor(0x3498db)
        .setTitle('🔄 Rolle ersetzen - Schritt 1/2')
        .setDescription('**Wähle die Rolle aus, die du ersetzen möchtest:**\n\nDiese Rolle wird durch eine neue Rolle ersetzt, behält aber das gleiche Emoji.')
        .setFooter({ text: 'Wähle eine Rolle aus der Liste' });

    await interaction.followUp({
        embeds: [embed],
        components: [actionRow],
        ephemeral: true
    });

    // Collector für die Rollen-Auswahl
    const filter = i => i.customId === 'select_role_to_replace' && i.user.id === originalInteraction.user.id;
    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

    collector.on('collect', async i => {
        await i.deferUpdate();
        
        const selectedRoleId = i.values[0];
        const selectedRole = roles.find(r => r.id === selectedRoleId);
        
        if (!selectedRole) {
            await i.followUp({
                content: '❌ Rolle nicht gefunden!',
                ephemeral: true
            });
            return;
        }

        // Jetzt zeige das Menü für die neue Rolle
        await showNewRoleSelection(i, originalInteraction, guildConfig, selectedRole);
        collector.stop();
    });
}

// Menü: Neue Rolle auswählen
async function showNewRoleSelection(interaction, originalInteraction, guildConfig, oldRole) {
    // Hole alle Server-Rollen (außer @everyone und Bot-Rollen)
    const allRoles = originalInteraction.guild.roles.cache
        .filter(role => 
            role.id !== originalInteraction.guild.id && // Nicht @everyone
            !role.managed // Keine Bot-Rollen
        )
        .sort((a, b) => b.position - a.position)
        .first(25); // Max 25 Rollen für das Menü

    if (allRoles.size === 0) {
        return interaction.followUp({
            content: '❌ Keine anderen Rollen im Server gefunden!',
            ephemeral: true
        });
    }

    // Erstelle Auswahl-Menü für die neue Rolle
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('select_new_role')
        .setPlaceholder('Wähle die neue Rolle...')
        .addOptions(
            allRoles.map(role => ({
                label: role.name.substring(0, 100),
                description: `Position: ${role.position}`,
                value: role.id,
                emoji: role.id === oldRole.id ? '⚠️' : undefined
            }))
        );

    const actionRow = new ActionRowBuilder().addComponents(selectMenu);

    const embed = new EmbedBuilder()
        .setColor(0x2ecc71)
        .setTitle('🔄 Rolle ersetzen - Schritt 2/2')
        .setDescription(`**Alte Rolle:** ${oldRole.emoji} ${oldRole.name}\n\n**Wähle die neue Rolle:**`)
        .addFields(
            {
                name: 'ℹ️ Information:',
                value: `• Das Emoji **${oldRole.emoji}** bleibt gleich\n• Die alte Rolle wird aus dem System entfernt\n• Die neue Rolle wird hinzugefügt`,
                inline: false
            }
        )
        .setFooter({ text: 'Wähle die Ersatz-Rolle aus' });

    await interaction.followUp({
        embeds: [embed],
        components: [actionRow],
        ephemeral: true
    });

    // Collector für die neue Rollen-Auswahl
    const filter = i => i.customId === 'select_new_role' && i.user.id === originalInteraction.user.id;
    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

    collector.on('collect', async i => {
        await i.deferUpdate();
        
        const newRoleId = i.values[0];
        const newRole = originalInteraction.guild.roles.cache.get(newRoleId);
        
        if (!newRole) {
            await i.followUp({
                content: '❌ Rolle nicht gefunden!',
                ephemeral: true
            });
            return;
        }

        // Bestätigungs-Embed
        const confirmEmbed = new EmbedBuilder()
            .setColor(0xf1c40f)
            .setTitle('⚠️ Rolle ersetzen - Bestätigung')
            .setDescription('Bist du sicher, dass du diese Rolle ersetzen möchtest?')
            .addFields(
                {
                    name: '🔴 Alte Rolle:',
                    value: `${oldRole.emoji} **${oldRole.name}**\nID: ${oldRole.id}`,
                    inline: true
                },
                {
                    name: '🟢 Neue Rolle:',
                    value: `${oldRole.emoji} **${newRole.name}**\nID: ${newRole.id}`,
                    inline: true
                }
            )
            .setFooter({ text: 'Diese Aktion kann nicht rückgängig gemacht werden' });

        // Bestätigungs-Buttons
        const confirmRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`confirm_replace_${oldRole.id}_${newRole.id}`)
                    .setLabel('✅ Ja, ersetzen')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('cancel_replace')
                    .setLabel('❌ Abbrechen')
                    .setStyle(ButtonStyle.Danger)
            );

        await i.followUp({
            embeds: [confirmEmbed],
            components: [confirmRow],
            ephemeral: true
        });

        collector.stop();
    });
}

// Menü: Rolle bearbeiten
async function showEditRoleMenu(interaction, originalInteraction, guildConfig) {
    const roles = Object.values(guildConfig.selfroleRoles);
    
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('select_role_to_edit')
        .setPlaceholder('Wähle eine Rolle zum Bearbeiten...')
        .addOptions(
            roles.map(role => ({
                label: role.name.substring(0, 100),
                description: `Emoji: ${role.emoji}`,
                value: role.id,
                emoji: role.emoji
            }))
        );

    const actionRow = new ActionRowBuilder().addComponents(selectMenu);

    const embed = new EmbedBuilder()
        .setColor(0x9b59b6)
        .setTitle('✏️ Rolle bearbeiten')
        .setDescription('Wähle eine Rolle aus, die du bearbeiten möchtest:')
        .setFooter({ text: 'Diese Funktion ist noch in Entwicklung' });

    await interaction.followUp({
        embeds: [embed],
        components: [actionRow],
        ephemeral: true
    });
}

// Menü: Rolle löschen
async function showDeleteRoleMenu(interaction, originalInteraction, guildConfig) {
    const roles = Object.values(guildConfig.selfroleRoles);
    
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('select_role_to_delete')
        .setPlaceholder('Wähle eine Rolle zum Löschen...')
        .addOptions(
            roles.map(role => ({
                label: role.name.substring(0, 100),
                description: `Emoji: ${role.emoji}`,
                value: role.id,
                emoji: role.emoji
            }))
        );

    const actionRow = new ActionRowBuilder().addComponents(selectMenu);

    const embed = new EmbedBuilder()
        .setColor(0xe74c3c)
        .setTitle('🗑️ Rolle löschen')
        .setDescription('Wähle eine Rolle aus, die du löschen möchtest:')
        .setFooter({ text: 'Diese Aktion kann nicht rückgängig gemacht werden' });

    await interaction.followUp({
        embeds: [embed],
        components: [actionRow],
        ephemeral: true
    });

    // Collector für Lösch-Auswahl
    const filter = i => i.customId === 'select_role_to_delete' && i.user.id === originalInteraction.user.id;
    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

    collector.on('collect', async i => {
        await i.deferUpdate();
        
        const selectedRoleId = i.values[0];
        const selectedRole = roles.find(r => r.id === selectedRoleId);
        
        if (!selectedRole) {
            await i.followUp({
                content: '❌ Rolle nicht gefunden!',
                ephemeral: true
            });
            return;
        }

        // Bestätigungs-Embed
        const confirmEmbed = new EmbedBuilder()
            .setColor(0xe74c3c)
            .setTitle('⚠️ Rolle löschen - Bestätigung')
            .setDescription('Bist du sicher, dass du diese Rolle löschen möchtest?')
            .addFields(
                {
                    name: 'Zu löschende Rolle:',
                    value: `${selectedRole.emoji} **${selectedRole.name}**\nID: ${selectedRole.id}`,
                    inline: false
                },
                {
                    name: '⚠️ Warnung:',
                    value: '• Alle User verlieren diese Selfrole\n• Das Emoji wird entfernt\n• Die Selfrole-Nachricht wird aktualisiert',
                    inline: false
                }
            )
            .setFooter({ text: 'Diese Aktion kann nicht rückgängig gemacht werden' });

        // Bestätigungs-Buttons
        const confirmRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`confirm_delete_${selectedRole.id}`)
                    .setLabel('✅ Ja, löschen')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('cancel_delete')
                    .setLabel('❌ Abbrechen')
                    .setStyle(ButtonStyle.Secondary)
            );

        await i.followUp({
            embeds: [confirmEmbed],
            components: [confirmRow],
            ephemeral: true
        });

        collector.stop();
    });
}