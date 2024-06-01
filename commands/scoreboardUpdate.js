const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('update')
		.setDescription('Update a movie\'s title or rank on the scoreboard')
        .addIntegerOption(option =>
            option.setName('currentrank')
                .setDescription('The current rank of the movie being updated.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('newtitle')
                .setDescription('(Optional) The new title for this movie.')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('newrank')
                .setDescription('(Optional) The new rank for this movie.')
                .setRequired(false)),
    // This is not actually called, the command is handled in bot.js' client.on(Events.InteractionCreate...)
	async execute(interaction) {
        interaction.reply({
            content: "Pong!",
            ephemeral:true,
        });
	},
};
