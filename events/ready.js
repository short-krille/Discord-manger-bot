module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(`✅ Bot eingeloggt als ${client.user.tag}`);
        console.log(`📊 Server: ${client.guilds.cache.size}`);

        // Slash Commands registrieren
        try {
            const commands = [];
            const commandFiles = require('fs').readdirSync('./commands').filter(file => file.endsWith('.js'));

            for (const file of commandFiles) {
                const command = require(`../commands/${file}`);
                commands.push(command.data.toJSON());
            }

            // Global oder für eine spezifische Guild registrieren
            if (process.env.GUILD_ID) {
                const guild = await client.guilds.fetch(process.env.GUILD_ID);
                await guild.commands.set(commands);
                console.log(`✅ Slash Commands für Guild ${guild.name} registriert`);
            } else {
                await client.application.commands.set(commands);
                console.log('✅ Slash Commands global registriert');
            }

            // Bot Status setzen
            client.user.setPresence({
                activities: [{ name: '/setup | Reaction Roles', type: 3 }],
                status: 'online'
            });

        } catch (error) {
            console.error('Error registering commands:', error);
        }
    }
};