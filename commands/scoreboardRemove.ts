import { SlashCommandBuilder, CommandInteraction } from 'discord.js';

export default {
	data: new SlashCommandBuilder()
		.setName('remove')
		.setDescription('Remove a movie from the scoreboard.')
        .addIntegerOption(option =>
            option.setName('rank')
                .setDescription('The rank of the movie being removed.')
                .setRequired(true)),
};
