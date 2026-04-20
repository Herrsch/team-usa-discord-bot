import { SlashCommandBuilder, CommandInteraction } from 'discord.js';

export default {
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
};
