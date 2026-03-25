const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
        console.log(`✅ Geladen: ${command.data.name}`);
    } else {
        console.log(`⚠️ Ungültig: ${file}`);
    }
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log(`🔄 Registriere ${commands.length} Commands...`);
        
        // Global registrieren
        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );
        
        console.log(`✅ ${data.length} Commands erfolgreich registriert!`);
        console.log('📋 Commands:');
        data.forEach(cmd => console.log(`  - ${cmd.name}`));
        
    } catch (error) {
        console.error('❌ Fehler:', error);
    }
})();