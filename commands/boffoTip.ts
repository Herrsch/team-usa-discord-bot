import { SlashCommandBuilder, CommandInteraction } from 'discord.js';

export default {
	data: new SlashCommandBuilder()
		.setName('tip')
		.setDescription('Send Boffos to another user.')
        .addUserOption(option =>
            option.setName('recipient')
                .setDescription('The user you\'re sending Boffos to')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number of Boffos you\'d like to send')
                .setRequired(true)),
};
