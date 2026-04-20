import { SlashCommandBuilder, CommandInteraction } from 'discord.js';

export default {
	data: new SlashCommandBuilder()
		.setName('add')
		.setDescription('Add a movie to the scoreboard. Grant allowance to all users in voice channel when Ben uses this.')
        .addStringOption(option =>
            option.setName('movie')
                .setDescription('The movie title being added to the scoreboard.')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('rank')
                .setDescription('The movie\'s rank on the scoreboard.')
                .setRequired(true)),
};
