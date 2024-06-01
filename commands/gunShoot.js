const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('shoot')
		.setDescription('Give user a short timeout. To shoot multiple users or shoot via message reply, use ~shoot.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user you\'re silencing.')
                .setRequired(true)),
    // This is not actually called, the command is handled in bot.js' client.on(Events.InteractionCreate...)
	async execute(interaction) {
        interaction.reply({
            content: "Pong!",
            ephemeral:true,
        });
	},
};
