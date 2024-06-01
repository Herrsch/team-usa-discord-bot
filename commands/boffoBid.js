const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('bid')
		.setDescription('Spend Boffos to acquire a server emote.')
        .addStringOption(option =>
            option.setName('emote')
                .setDescription('The emote you\'re bidding on')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number of Boffos you\'re bidding. Must be higher than the current owner\'s bid.')
                .setRequired(true)),
    // This is not actually called, the command is handled in bot.js' client.on(Events.InteractionCreate...)
	async execute(interaction) {
        interaction.reply({
            content: "Pong!",
            ephemeral:true,
        });
	},
};
