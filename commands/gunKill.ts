import { SlashCommandBuilder, CommandInteraction } from 'discord.js';

export default {
	data: new SlashCommandBuilder()
		.setName('kill')
		.setDescription('Give user a long timeout. Costs ₿40.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user you\'re silencing.')
                .setRequired(true)),
    // This is not actually called, the command is handled in bot.js' client.on(Events.InteractionCreate...)
	async execute(interaction: CommandInteraction) {
        interaction.reply({
            content: "Pong!",
            ephemeral:true,
        });
	},
};
