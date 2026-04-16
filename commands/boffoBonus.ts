import { SlashCommandBuilder, PermissionsBitField, PermissionFlagsBits, CommandInteraction } from 'discord.js';

export default {
	data: new SlashCommandBuilder()
		.setName('bonus')
		.setDescription('Grant a Boffo bonus to a user.')
        .addUserOption(option =>
            option.setName('recipient')
                .setDescription('The user you\'re granting Boffos to')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number of Boffos you\'d like to grant')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    // This is not actually called, the command is handled in bot.js' client.on(Events.InteractionCreate...)
	async execute(interaction: CommandInteraction) {
        interaction.reply({
            content: "Pong!",
            ephemeral:true,
        });
	},
};
