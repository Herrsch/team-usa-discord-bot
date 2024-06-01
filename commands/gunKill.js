const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('kill')
		.setDescription('Give user a long timeout. To kill multiple users or kill via message reply, use ~kill.')
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
