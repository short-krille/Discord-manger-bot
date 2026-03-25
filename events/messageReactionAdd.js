const { Events } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: Events.MessageReactionAdd,
    async execute(reaction, user, client) {
        // Bot-Reactions ignorieren
        if (user.bot) return;

        // Reaction könnte teilweise entfernt sein
        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                console.error('Fehler beim fetchen der Reaction:', error);
                return;
            }
        }

        // Message fetchen falls partial
        if (reaction.message.partial) {
            try {
                await reaction.message.fetch();
            } catch (error) {
                console.error('Fehler beim fetchen der Message:', error);
                return;
            }
        }

        const guildId = reaction.message.guild.id;
        const configPath = path.join(__dirname, '../config/config.json');
        
        // Config laden
        let config;
        try {
            config = require(configPath);
        } catch (error) {
            console.error('Fehler beim Laden der Config:', error);
            return;
        }

        const guildConfig = config.guildConfigs[guildId];
        if (!guildConfig) return;

        // Regelwerk Reaction (✅)
        if (guildConfig.rulesChannel && reaction.message.channel.id === guildConfig.rulesChannel) {
            if (reaction.emoji.name === '✅') {
                // Hier könntest du eine Bestätigungs-Rolle vergeben
                // z.B. "Regeln gelesen" Rolle
                console.log(`${user.tag} hat die Regeln akzeptiert`);
            }
            return;
        }

        // Selfrole Reaction
        if (guildConfig.selfroleMessageId && reaction.message.id === guildConfig.selfroleMessageId) {
            const selfrole = guildConfig.selfroles.find(sr => sr.emoji === reaction.emoji.name || sr.emoji === reaction.emoji.toString());
            
            if (selfrole) {
                try {
                    const member = await reaction.message.guild.members.fetch(user.id);
                    const role = await reaction.message.guild.roles.fetch(selfrole.roleId);
                    
                    if (member && role) {
                        await member.roles.add(role);
                        console.log(`Rolle ${role.name} an ${user.tag} vergeben`);
                        
                        // DM Bestätigung senden
                        try {
                            await user.send({
                                embeds: [{
                                    color: 0x57f287,
                                    title: '✅ Rolle erhalten',
                                    description: `Du hast die Rolle **${role.name}** erhalten!`,
                                    timestamp: new Date()
                                }]
                            });
                        } catch (dmError) {
                            // DM nicht möglich, ignoriere
                        }
                    }
                } catch (error) {
                    console.error('Fehler beim Vergeben der Rolle:', error);
                }
            }
        }
    }
};