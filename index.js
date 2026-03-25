const { Client, GatewayIntentBits, Collection, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('🚀 Starte Discord Bot...');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent
    ]
});

client.commands = new Collection();

// Commands laden
try {
    const commandsPath = path.join(__dirname, 'commands');
    console.log(`📁 Lade Commands aus: ${commandsPath}`);
    
    if (fs.existsSync(commandsPath)) {
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        console.log(`📋 Gefundene Commands: ${commandFiles}`);
        
        for (const file of commandFiles) {
            try {
                const filePath = path.join(commandsPath, file);
                delete require.cache[require.resolve(filePath)]; // Cache leeren
                const command = require(filePath);
                
                if ('data' in command && 'execute' in command) {
                    client.commands.set(command.data.name, command);
                    console.log(`✅ Command geladen: ${command.data.name}`);
                } else {
                    console.log(`⚠️ Ungültiger Command: ${file}`);
                }
            } catch (error) {
                console.error(`❌ Fehler beim Laden von ${file}:`, error.message);
            }
        }
    } else {
        console.log('❌ Commands Ordner existiert nicht! Erstelle...');
        fs.mkdirSync(commandsPath, { recursive: true });
    }
} catch (error) {
    console.error('❌ Fehler beim Laden der Commands:', error);
}

// Events laden (falls vorhanden)
try {
    const eventsPath = path.join(__dirname, 'events');
    if (fs.existsSync(eventsPath)) {
        const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
        console.log(`📁 Lade Events: ${eventFiles.length} gefunden`);
        
        for (const file of eventFiles) {
            try {
                const filePath = path.join(eventsPath, file);
                const event = require(filePath);
                
                if (event.once) {
                    client.once(event.name, (...args) => event.execute(...args, client));
                } else {
                    client.on(event.name, (...args) => event.execute(...args, client));
                }
                console.log(`✅ Event geladen: ${event.name}`);
            } catch (error) {
                console.error(`❌ Fehler beim Laden von Event ${file}:`, error);
            }
        }
    }
} catch (error) {
    console.error('❌ Fehler beim Laden der Events:', error);
}

// ==============================
// REACTION HANDLER FÜR SELFROLES (AKTUALISIERT)
// ==============================

// Reaction Add Handler - Benutzer bekommt Rolle
client.on('messageReactionAdd', async (reaction, user) => {
    // Ignoriere Bot-Reactions
    if (user.bot) return;
    
    console.log(`🔔 Reaction hinzugefügt: ${reaction.emoji.name} von ${user.tag}`);
    
    try {
        // Wenn die Reaction teilweise ist, komplett laden
        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                console.error('❌ Konnte Reaction nicht fetchen:', error);
                return;
            }
        }
        
        // Config laden
        const configPath = path.join(__dirname, 'config/config.json');
        if (!fs.existsSync(configPath)) {
            console.log('❌ Config Datei nicht gefunden');
            return;
        }
        
        const config = require(configPath);
        const guildId = reaction.message.guild?.id;
        
        if (!guildId || !config[guildId] || !config[guildId].selfroleMessageId) {
            console.log('❌ Keine Selfrole-Konfiguration für diesen Server');
            return;
        }
        
        // Prüfe ob es die richtige Message ist
        if (reaction.message.id !== config[guildId].selfroleMessageId) {
            return;
        }
        
        // Emoji zu Rollen-Mapping (aus Config laden)
        let emojiRoleMap = {};
        if (config[guildId].emojiRoleMap) {
            emojiRoleMap = config[guildId].emojiRoleMap;
        } else {
            // Fallback zu altem Mapping
            emojiRoleMap = {
                '📰': 'news',
                '🎥': 'stream',
                '🌱': 'minecraft',
                '🎉': 'giveaway',
                '🤝': 'partner',
                '🎀': 'tiktok'
            };
        }
        
        const emojiName = reaction.emoji.name;
        const roleKey = emojiRoleMap[emojiName];
        
        if (!roleKey) {
            console.log(`❌ Unbekanntes Emoji: ${emojiName}`);
            return;
        }
        
        console.log(`🎯 Suche Rolle für Key: ${roleKey} mit Emoji: ${emojiName}`);
        
        // Rolle aus Config finden
        let role = null;
        if (config[guildId].selfroleRoles && config[guildId].selfroleRoles[roleKey]) {
            const roleInfo = config[guildId].selfroleRoles[roleKey];
            role = reaction.message.guild.roles.cache.get(roleInfo.id);
            if (role) {
                console.log(`✅ Rolle aus Config gefunden: ${role.name} (ID: ${role.id})`);
            }
        }
        
        // Fallback: Suche nach Namen
        if (!role) {
            role = reaction.message.guild.roles.cache.find(r => 
                r.name.toLowerCase().includes(roleKey.toLowerCase()) ||
                r.name.toLowerCase() === roleKey.toLowerCase()
            );
            if (role) {
                console.log(`✅ Rolle via Namenssuche gefunden: ${role.name}`);
            }
        }
        
        if (!role) {
            console.log(`❌ Rolle für "${roleKey}" nicht gefunden!`);
            return;
        }
        
        // Benutzer holen und Rolle geben
        const member = await reaction.message.guild.members.fetch(user.id);
        await member.roles.add(role);
        
        console.log(`✅ Rolle ${role.name} an ${user.tag} gegeben`);
        
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
        
    } catch (error) {
        console.error('💥 Fehler bei Reaction Add:', error);
    }
});

// Reaction Remove Handler - Rolle wird entfernt
client.on('messageReactionRemove', async (reaction, user) => {
    if (user.bot) return;
    
    console.log(`❌ Reaction entfernt: ${reaction.emoji.name} von ${user.tag}`);
    
    try {
        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                console.error('❌ Konnte Reaction nicht fetchen:', error);
                return;
            }
        }
        
        const configPath = path.join(__dirname, 'config/config.json');
        if (!fs.existsSync(configPath)) return;
        
        const config = require(configPath);
        const guildId = reaction.message.guild?.id;
        
        if (!guildId || !config[guildId] || !config[guildId].selfroleMessageId) return;
        
        if (reaction.message.id !== config[guildId].selfroleMessageId) return;
        
        // Emoji zu Rollen-Mapping (aus Config laden)
        let emojiRoleMap = {};
        if (config[guildId].emojiRoleMap) {
            emojiRoleMap = config[guildId].emojiRoleMap;
        } else {
            // Fallback zu altem Mapping
            emojiRoleMap = {
                '📰': 'news',
                '🎥': 'stream',
                '🌱': 'minecraft',
                '🎉': 'giveaway',
                '🤝': 'partner',
                '🎀': 'tiktok'
            };
        }
        
        const emojiName = reaction.emoji.name;
        const roleKey = emojiRoleMap[emojiName];
        
        if (!roleKey) return;
        
        // Rolle aus Config finden
        let role = null;
        if (config[guildId].selfroleRoles && config[guildId].selfroleRoles[roleKey]) {
            const roleInfo = config[guildId].selfroleRoles[roleKey];
            role = reaction.message.guild.roles.cache.get(roleInfo.id);
        }
        
        // Fallback: Suche nach Namen
        if (!role) {
            role = reaction.message.guild.roles.cache.find(r => 
                r.name.toLowerCase().includes(roleKey.toLowerCase()) ||
                r.name.toLowerCase() === roleKey.toLowerCase()
            );
        }
        
        if (!role) {
            return;
        }
        
        const member = await reaction.message.guild.members.fetch(user.id);
        await member.roles.remove(role);
        
        console.log(`❌ Rolle ${role.name} von ${user.tag} entfernt`);
        
        // DM Bestätigung
        try {
            await user.send({
                embeds: [{
                    color: 0xed4245,
                    title: '❌ Rolle entfernt',
                    description: `Du hast die Rolle **${role.name}** entfernt!`,
                    timestamp: new Date()
                }]
            });
        } catch (dmError) {
            // DM nicht möglich
        }
        
    } catch (error) {
        console.error('💥 Fehler bei Reaction Remove:', error);
    }
});

// Bot starten
client.once('ready', async () => {
    console.log(`✅ Bot eingeloggt als ${client.user.tag}`);
    console.log(`📊 Server: ${client.guilds.cache.size}`);
    
    // Slash Commands registrieren
    try {
        const commands = [];
        
        for (const [name, command] of client.commands) {
            commands.push(command.data.toJSON());
            console.log(`📝 Registriere Command: ${name}`);
        }
        
        // Global registrieren
        await client.application.commands.set(commands);
        console.log(`✅ ${commands.length} Slash Commands registriert`);
        
    } catch (error) {
        console.error('❌ Error registering commands:', error);
    }
    
    // Bot Status setzen
    client.user.setPresence({
        activities: [{ name: 'ShortSystem Bot', type: 3 }],
        status: 'online'
    });
});

// Slash Command Handler - EINFACH
client.on('interactionCreate', async interaction => {
    // Nur Slash Commands behandeln
    if (!interaction.isChatInputCommand()) return;
    
    console.log(`🔧 Command empfangen: ${interaction.commandName}`);
    
    const command = client.commands.get(interaction.commandName);
    
    if (!command) {
        console.error(`❌ Command nicht gefunden: ${interaction.commandName}`);
        return interaction.reply({ 
            content: '❌ Dieser Command wurde nicht gefunden!', 
            ephemeral: true 
        });
    }
    
    try {
        console.log(`▶️ Führe aus: ${interaction.commandName}`);
        await command.execute(interaction);
        console.log(`✅ Command erfolgreich: ${interaction.commandName}`);
    } catch (error) {
        console.error(`💥 Fehler bei ${interaction.commandName}:`, error);
        
        const errorMessage = error.message.length > 100 ? 
            error.message.substring(0, 100) + '...' : 
            error.message;
        
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
});

// ==============================
// ROLE EDITOR COLLECTOR HANDLER (NEU!)
// ==============================
client.on('interactionCreate', async interaction => {
    // Nur für Rollen-Editor spezifische Interaktionen
    if (!interaction.isStringSelectMenu() && !interaction.isButton()) return;
    
    // DEBUG: Zeige alle Interaktionen
    console.log(`🔄 Interaction: ${interaction.customId} - Type: ${interaction.type}`);
    
    // Handle Rollen-Ersetzung Bestätigung
    if (interaction.isButton() && interaction.customId.startsWith('confirm_replace_')) {
        try {
            await interaction.deferUpdate();
            
            const parts = interaction.customId.split('_');
            const oldRoleId = parts[2];
            const newRoleId = parts[3];
            
            console.log(`🔄 Ersetze Rolle: ${oldRoleId} → ${newRoleId}`);
            
            // Config laden
            const configPath = path.join(__dirname, 'config/config.json');
            if (!fs.existsSync(configPath)) {
                return interaction.followUp({
                    content: '❌ Config Datei nicht gefunden!',
                    ephemeral: true
                });
            }
            
            const config = require(configPath);
            const guildId = interaction.guild.id;
            const guildConfig = config[guildId];
            
            if (!guildConfig || !guildConfig.selfroleRoles) {
                return interaction.followUp({
                    content: '❌ Keine Selfrole-Konfiguration gefunden!',
                    ephemeral: true
                });
            }
            
            // Finde den Key der alten Rolle
            const roleKey = Object.keys(guildConfig.selfroleRoles).find(key => 
                guildConfig.selfroleRoles[key].id === oldRoleId
            );
            
            if (!roleKey) {
                return interaction.followUp({
                    content: '❌ Alte Rolle nicht in der Config gefunden!',
                    ephemeral: true
                });
            }
            
            const oldRole = guildConfig.selfroleRoles[roleKey];
            const newRole = interaction.guild.roles.cache.get(newRoleId);
            
            if (!newRole) {
                return interaction.followUp({
                    content: '❌ Neue Rolle nicht gefunden!',
                    ephemeral: true
                });
            }
            
            // Rolle ersetzen
            guildConfig.selfroleRoles[roleKey] = {
                id: newRole.id,
                name: newRole.name,
                emoji: oldRole.emoji,
                description: oldRole.description || 'Keine Beschreibung'
            };
            
            // Config speichern
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
            console.log(`✅ Config gespeichert: ${roleKey} → ${newRole.name}`);
            
            // Selfrole-Nachricht aktualisieren
            try {
                const channel = await interaction.guild.channels.fetch(guildConfig.selfroleChannel);
                const message = await channel.messages.fetch(guildConfig.selfroleMessageId);
                
                const roles = Object.values(guildConfig.selfroleRoles);
                
                const embed = new EmbedBuilder()
                    .setColor(0x2b2d31)
                    .setTitle('🎭 Selfrole System')
                    .setDescription('Reagiere mit den Emojis unten, um dir selbst Rollen zu geben oder zu entfernen!')
                    .addFields(
                        {
                            name: 'Verfügbare Rollen:',
                            value: roles.map(role => {
                                return `${role.emoji} **${role.name}**\n${role.description || 'Keine Beschreibung'}\n`;
                            }).join('\n'),
                            inline: false
                        }
                    )
                    .setFooter({ text: `ShortSystem Bot • ${roles.length} Rollen verfügbar` })
                    .setTimestamp();
                
                await message.edit({ embeds: [embed] });
                
                // Reactions aktualisieren
                await message.reactions.removeAll();
                for (const role of roles) {
                    try {
                        await message.react(role.emoji);
                    } catch (reactionError) {
                        console.error(`Fehler beim Hinzufügen von Reaction ${role.emoji}:`, reactionError);
                    }
                }
                
                console.log(`✅ Selfrole-Nachricht aktualisiert für Guild ${guildId}`);
                
            } catch (updateError) {
                console.error('Fehler beim Aktualisieren der Selfrole-Nachricht:', updateError);
                return interaction.followUp({
                    content: `⚠️ Rolle ersetzt, aber Selfrole-Nachricht konnte nicht aktualisiert werden: ${updateError.message}`,
                    ephemeral: true
                });
            }
            
            // Erfolgsmeldung
            const successEmbed = new EmbedBuilder()
                .setColor(0x57f287)
                .setTitle('✅ Rolle erfolgreich ersetzt!')
                .setDescription(`Die Rolle wurde von **${oldRole.name}** zu **${newRole.name}** geändert.`)
                .addFields(
                    {
                        name: 'Emoji:',
                        value: oldRole.emoji,
                        inline: true
                    },
                    {
                        name: 'Config-Key:',
                        value: roleKey,
                        inline: true
                    }
                )
                .setFooter({ text: 'Selfrole-Nachricht wurde aktualisiert' })
                .setTimestamp();
            
            await interaction.followUp({
                embeds: [successEmbed],
                ephemeral: true
            });
            
        } catch (error) {
            console.error('Fehler bei Rollen-Ersetzung:', error);
            await interaction.followUp({
                content: `❌ Fehler: ${error.message}`,
                ephemeral: true
            });
        }
    }
    
    // Handle Abbrechen Button
    if (interaction.isButton() && interaction.customId === 'cancel_replace') {
        await interaction.deferUpdate();
        await interaction.followUp({
            content: '❌ Rollen-Ersetzung abgebrochen.',
            ephemeral: true
        });
    }
    
    // Handle Rollen-Löschen Bestätigung
    if (interaction.isButton() && interaction.customId.startsWith('confirm_delete_')) {
        try {
            await interaction.deferUpdate();
            
            const roleId = interaction.customId.split('_')[2];
            
            // Config laden
            const configPath = path.join(__dirname, 'config/config.json');
            const config = require(configPath);
            const guildId = interaction.guild.id;
            const guildConfig = config[guildId];
            
            if (!guildConfig || !guildConfig.selfroleRoles) {
                return interaction.followUp({
                    content: '❌ Keine Selfrole-Konfiguration gefunden!',
                    ephemeral: true
                });
            }
            
            // Finde und entferne die Rolle
            const roleKey = Object.keys(guildConfig.selfroleRoles).find(key => 
                guildConfig.selfroleRoles[key].id === roleId
            );
            
            if (!roleKey) {
                return interaction.followUp({
                    content: '❌ Rolle nicht gefunden!',
                    ephemeral: true
                });
            }
            
            const deletedRole = guildConfig.selfroleRoles[roleKey];
            delete guildConfig.selfroleRoles[roleKey];
            
            // Entferne auch aus emojiRoleMap
            if (guildConfig.emojiRoleMap) {
                Object.keys(guildConfig.emojiRoleMap).forEach(emoji => {
                    if (guildConfig.emojiRoleMap[emoji] === roleKey) {
                        delete guildConfig.emojiRoleMap[emoji];
                    }
                });
            }
            
            // Config speichern
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
            
            // Selfrole-Nachricht aktualisieren
            try {
                const channel = await interaction.guild.channels.fetch(guildConfig.selfroleChannel);
                const message = await channel.messages.fetch(guildConfig.selfroleMessageId);
                
                const roles = Object.values(guildConfig.selfroleRoles);
                
                if (roles.length === 0) {
                    // Wenn keine Rollen mehr, leere Nachricht
                    const emptyEmbed = new EmbedBuilder()
                        .setColor(0xff0000)
                        .setTitle('❌ Selfrole-System')
                        .setDescription('Derzeit sind keine Selfrole-Rollen konfiguriert.\nBitte verwende `/roles-editor` um Rollen hinzuzufügen.')
                        .setTimestamp();
                    
                    await message.edit({ embeds: [emptyEmbed] });
                    await message.reactions.removeAll();
                } else {
                    // Normales Update
                    const embed = new EmbedBuilder()
                        .setColor(0x2b2d31)
                        .setTitle('🎭 Selfrole System')
                        .setDescription('Reagiere mit den Emojis unten, um dir selbst Rollen zu geben oder zu entfernen!')
                        .addFields(
                            {
                                name: 'Verfügbare Rollen:',
                                value: roles.map(role => {
                                    return `${role.emoji} **${role.name}**\n${role.description || 'Keine Beschreibung'}\n`;
                                }).join('\n'),
                                inline: false
                            }
                        )
                        .setFooter({ text: `ShortSystem Bot • ${roles.length} Rollen verfügbar` })
                        .setTimestamp();
                    
                    await message.edit({ embeds: [embed] });
                    
                    // Reactions aktualisieren
                    await message.reactions.removeAll();
                    for (const role of roles) {
                        await message.react(role.emoji);
                    }
                }
                
            } catch (updateError) {
                console.error('Fehler beim Aktualisieren:', updateError);
            }
            
            // Erfolgsmeldung
            await interaction.followUp({
                content: `✅ Rolle **${deletedRole.name}** erfolgreich gelöscht!`,
                ephemeral: true
            });
            
        } catch (error) {
            console.error('Fehler beim Löschen der Rolle:', error);
            await interaction.followUp({
                content: `❌ Fehler: ${error.message}`,
                ephemeral: true
            });
        }
    }
    
    // Handle Löschen Abbrechen
    if (interaction.isButton() && interaction.customId === 'cancel_delete') {
        await interaction.deferUpdate();
        await interaction.followUp({
            content: '❌ Rollen-Löschung abgebrochen.',
            ephemeral: true
        });
    }
});

// Error Handling
client.on('error', error => {
    console.error('💥 Discord Client Error:', error);
});

process.on('unhandledRejection', error => {
    console.error('💥 Unhandled Rejection:', error);
});

process.on('uncaughtException', error => {
    console.error('💥 Uncaught Exception:', error);
});

// Graceful Shutdown
process.on('SIGINT', () => {
    console.log('\n🔄 Beende Bot...');
    client.destroy();
    process.exit(0);
});

// Füge dies in deine index.js ein (vor client.login):

// DEBUG: Zeige geladene Commands
client.once('ready', async () => {
    console.log(`✅ Bot eingeloggt als ${client.user.tag}`);
    console.log(`📊 Server: ${client.guilds.cache.size}`);
    
    // Zeige alle geladenen Commands
    console.log('📋 Geladene Commands:');
    client.commands.forEach((cmd, name) => {
        console.log(`  - ${name}`);
    });
    
    // Slash Commands registrieren
    try {
        const commands = [];
        
        for (const [name, command] of client.commands) {
            commands.push(command.data.toJSON());
            console.log(`📝 Registriere Command: ${name}`);
        }
        
        // ZUERST alle alten Commands löschen
        console.log('🗑️ Lösche alte Commands...');
        await client.application.commands.set([]);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // DANACH neue registrieren
        console.log('📝 Registriere neue Commands...');
        await client.application.commands.set(commands);
        console.log(`✅ ${commands.length} Slash Commands registriert`);
        
        
    } catch (error) {
        console.error('❌ Error registering commands:', error);
    }
    
    // Bot Status setzen
    client.user.setPresence({
        activities: [{ name: 'ShortSystem Bot', type: 3 }],
        status: 'online'
    });
});
// Login
console.log('🔑 Versuche Login mit Token...');
client.login(process.env.DISCORD_TOKEN).catch(error => {
    console.error('❌ Login fehlgeschlagen:', error);
    process.exit(1);
});