import { SlashCommandBuilder, CommandInteraction } from 'discord.js';

export default {
	data: new SlashCommandBuilder()
		.setName('shoot')
		.setDescription('Give user a short timeout. Costs ₿20.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user you\'re silencing.')
                .setRequired(true)),
};
