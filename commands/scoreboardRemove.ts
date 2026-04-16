import { SlashCommandBuilder, CommandInteraction } from 'discord.js';

export default {
	data: new SlashCommandBuilder()
		.setName('remove')
		.setDescription('Remove a movie from the scoreboard.')
        .addIntegerOption(option =>
            option.setName('rank')
                .setDescription('The rank of the movie being removed.')
                .setRequired(true)),
    // This is not actually called, the command is handled in bot.js' client.on(Events.InteractionCreate...)
	async execute(interaction: CommandInteraction) {
        interaction.reply({
            content: "Pong!",
            ephemeral:true,
        });
	},
};
