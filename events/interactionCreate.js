const { Events } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        // Diese Datei sollte leer sein oder nur Logging enthalten
        // Der Haupt-Interaction-Handler ist in index.js
        
        if (interaction.isStringSelectMenu()) {
            console.log(`📌 Select Menu: ${interaction.customId}`);
            // Keine Action - wird in index.js gehandelt
        }
    }
};