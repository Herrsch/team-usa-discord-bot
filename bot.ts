import fs from 'node:fs';
import path from 'node:path';
import { Client, Collection, Events, GatewayIntentBits, ButtonBuilder, ActionRowBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags, TextChannel, Message, GuildMember, ButtonComponent, LabelBuilder, ButtonInteraction, ChatInputCommandInteraction, VoiceChannel, User } from 'discord.js';
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.GuildExpressions] });
import 'dotenv/config';
// const wait = require('util').promisify(setTimeout); // can use this to wait(1000) if need

interface Emote {
    id: string;
    owner: string;
    value: number;
}

const gunEmote = "<:kaboom:1467997874473144539>";
const gunEmote2 = "<:kaboom2:1467997917435531397>";
const nonFaceEmotes = [
    "1467997874473144539", // gunEmote (kaboom)
    "1467997917435531397", // gunEmote (kaboom2)
    "790367046868140053", // dunkaccino
    "872580606339469404" // escape (leave server)
];

const generalChannelId = process.env.generalChannelId ?? "";
const scoreboardChannelId = process.env.scoreboardChannelId ?? "";
const scoreboardArchiveChannelId = process.env.scoreboardArchiveChannelId ?? "";
const ledgerChannelId = process.env.ledgerChannelId ?? "";
const voiceChannelId = process.env.voiceChannelId ?? "";
const emoteOwnershipMessageId = process.env.emoteOwnershipMessageId ?? "";
const transactionHistoryMessageId = process.env.transactionHistoryMessageId ?? "";

const joeAttendanceCost = 50;

const scoreboardMessageIds = [
    "1047313677956681820",
    "1047313679147864114",
    "1047313680502628382",
    "1047313681647673384",
    "1047313682637537320"
];

const boffoBalanceIDsMap = new Map([ // User ID, balance post ID
    [process.env.benUserId ?? "",           "1072279148246081637"],
    [process.env.johnUserId ?? "",          "1072279160908681286"],
    [process.env.adamUserId ?? "",          "1072279173168631839"],
    [process.env.dylanUserId ?? "",         "1072279186032558110"],
    [process.env.garrettUserId ?? "",       "1072279198665814056"],
    [process.env.lenaUserId ?? "",          "1072279211437465640"],
    [process.env.kingNathanielUserId ?? "", "1072279223840022568"],
    [process.env.marenUserId ?? "",         "1072279236355833917"],
    [process.env.joeUserId ?? "",           "1072279248938746017"],
    [process.env.tedUserId ?? "",           "1072279261584576584"],
    [process.env.canadianDylanUserId ?? "", "1149063892807450758"]
]);

let emoteOwnershipMap = new Map<string, Emote>();
let accountBalancesMap = new Map<string, number>();
let recentTransactionsArray = new Array();
let chatCommands = new Collection<string, any>();

const commandsPath = path.join(import.meta.dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	import(filePath).then(command => {
	// Set a new item in the Collection with the key as the command name and the value as the exported module
	if ('data' in command.default && 'execute' in command.default) {
		chatCommands.set(command.default.data.name, command.default);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
    });
}

client.login(process.env.token);

async function initializeStore() { // Used for initializing or editing any template messages on startup
    const ledgerChannel = await client.channels.fetch(ledgerChannelId) as TextChannel;

    const addToWheelButton = new ButtonBuilder()
                            .setCustomId("addToWheelButton")
                            .setLabel("(₿100) Add to the wheel immediately")
                            .setStyle(ButtonStyle.Primary);

    const yourChoiceNextButton = new ButtonBuilder()
                                .setCustomId("yourChoiceNextButton")
                                .setLabel("(₿200) Choose the next movie")
                                .setStyle(ButtonStyle.Success);

    const vetoButton = new ButtonBuilder()
                           .setCustomId("vetoButton")
                           .setLabel("(₿300) Veto this week's movie")
                           .setStyle(ButtonStyle.Danger);


    const joeAttendsButton = new ButtonBuilder()
                        .setCustomId("joeAttendsButton")
                        .setLabel("(₿" + joeAttendanceCost + ") Joe mandatory attendance")
                        .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(addToWheelButton, yourChoiceNextButton, vetoButton, joeAttendsButton);

    ledgerChannel.send({content: "**~The ₿offo Boutique~**", components:[row]});
}

async function initializeNewAccount() {
    const ledgerChannel = await client.channels.fetch(ledgerChannelId) as TextChannel;
    const newUserId = process.env.canadianDylanUserId;

    await ledgerChannel.send("**~The Bank of ₿offos~\n  ~Canadian Branch~**\n~~                                          ~~");

    await ledgerChannel.send('<@' + newUserId + '>:');

    await ledgerChannel.send('₿100'); // Remember to get this message id and add it to boffoBalanceIDsMap
    
    await ledgerChannel.send("~~                                          ~~");
}

client.on('clientReady', () => {
    // initializeStore();
    initializeAccountBalances();
    initializeEmoteOwnership();
    initializeTransactionHistory();
    console.log(`Logged in as ${client.user?.tag}!`);
});

// MARK: Copy/Paste point

async function initializeAccountBalances() {
    const ledgerChannel = await client.channels.fetch(ledgerChannelId) as TextChannel;

    const users = Array.from(boffoBalanceIDsMap.keys());
    for (let i = 0; i < users.length; i++) {
        const userBalanceMessageId = boffoBalanceIDsMap.get(users[i]);
        if (userBalanceMessageId == null) { continue; }
        const message = await ledgerChannel.messages.fetch(userBalanceMessageId);
        const balanceNumber = message.content.substring(1).match(/\d/g)?.join("");
        if (balanceNumber != null) {
            accountBalancesMap.set(users[i], parseInt(balanceNumber));
        }
    };
}

async function initializeEmoteOwnership() {
    const emoteOwnershipMessage = await getEmoteOwnershipMessage();
    let emoteOwnershipMessageContent = emoteOwnershipMessage.content.split("\n");
    
    for (let i = 0; i < emoteOwnershipMessageContent.length; i++) {
        
        const thisOwnershipLine = emoteOwnershipMessageContent[i];
        if (!thisOwnershipLine.startsWith("<@")) {
            continue;
        }

        const emoteOwnerId = thisOwnershipLine.substring(2, thisOwnershipLine.search(">"));

        const emotes = thisOwnershipLine.match(/<:.+?:\d+>/g);

        if (emotes == null) {
            continue;
        }
        for (let j = 0; j < emotes.length; j++) {
            const emoteStringIndex = thisOwnershipLine.search(emotes[j]);
            // find emote price
            let emotePriceString = thisOwnershipLine.substring(emoteStringIndex + emotes[j].length + 1);
            const regExp = /\(([^)]+)\)/;
            emotePriceString = regExp.exec(emotePriceString)?.at(1) ?? '';
            let emotePrice = parseInt(emotePriceString.match(/\d/g)?.join("") ?? '');

            emoteOwnershipMap.set( emotes[j], { id: emotes[j], owner: emoteOwnerId, value: emotePrice } );
        }
    }
}

async function initializeTransactionHistory() {
    const ledgerChannel = await client.channels.fetch(ledgerChannelId) as TextChannel;
    const transactionHistoryMessage = await ledgerChannel.messages.fetch(transactionHistoryMessageId);

    recentTransactionsArray = transactionHistoryMessage.content.split("\n\n");
}

async function getMovieCollection(channel: TextChannel) {
    const message = await channel.messages.fetch(scoreboardMessageIds[0]);
    let movieCollection = message.content.split("\n");

    for (let i = 1; i < scoreboardMessageIds.length; i++) {
        const message2 = await channel.messages.fetch(scoreboardMessageIds[i]);
        if (!message2.content.startsWith("List Part ")) {
            movieCollection = [...movieCollection, ...message2.content.split("\n")];
        }
    }

    return movieCollection;
}

function getBalanceForUser(userId: string): number {
    return accountBalancesMap.get(userId) ?? 0;
}

function updateBalanceForUserId(userId: string, newBalance: number) {
    accountBalancesMap.set(userId, newBalance);

    updateBalancePostForUserId(userId);
}

function addToBalanceForUserId(userId: string, amountToAdd: number) {
    if (!accountBalancesMap.has(userId)) {
        return;
    }

    let newBalance = getBalanceForUser(userId) + Math.round(amountToAdd);
    accountBalancesMap.set(userId, newBalance);

    updateBalancePostForUserId(userId);
}

async function updateBalancePostForUserId(userId: string) {
    const ledgerChannel = await client.channels.fetch(ledgerChannelId) as TextChannel;
    await ledgerChannel.messages.fetch(boffoBalanceIDsMap.get(userId) ?? '').then( message => message.edit("₿" + getBalanceForUser(userId).toLocaleString("en-US")));
}

async function getEmoteOwnershipMessage() {
    const ledgerChannel = await client.channels.fetch(ledgerChannelId) as TextChannel;
    const message = await ledgerChannel.messages.fetch(emoteOwnershipMessageId);

    return message;
}

async function updateEmoteOwnershipMessage() {
    const ownershipMessage = await getEmoteOwnershipMessage();

    let ownersMap = new Map();
    emoteOwnershipMap.forEach(emote => {
        if (ownersMap.has(emote.owner)) {
            let ownershipLine = ownersMap.get(emote.owner) + " | " + emote.id + " (₿" + emote.value + ")";
            ownersMap.set(emote.owner, ownershipLine);
        } else {
            ownersMap.set(emote.owner, "<@" + emote.owner + ">'s emotes: " + emote.id + " (₿" + emote.value + ")");
        }
    });
    let ownersArray = Array.from(ownersMap.values());
    ownershipMessage.edit(ownersArray.join("\n"));
}

async function addToTransactionHistory(transactionToAdd: string) {
    const ledgerChannel = await client.channels.fetch(ledgerChannelId) as TextChannel;
    const transactionHistoryMessage = await ledgerChannel.messages.fetch(transactionHistoryMessageId);

    // Add timestamp to the new transaction
    transactionToAdd = "<t:" + (Date.now() / 1000).toString + ":f> " + transactionToAdd;

    recentTransactionsArray.pop();
    recentTransactionsArray.splice(1, 0, transactionToAdd);

    transactionHistoryMessage.edit(recentTransactionsArray.join("\n\n"));
}

async function trackInterestInTransactionHistory(userId: string, emote: string) {
    const ledgerChannel = await client.channels.fetch(ledgerChannelId) as TextChannel;
    const transactionHistoryMessage = await ledgerChannel.messages.fetch(transactionHistoryMessageId);

    for (let i = 1; i < recentTransactionsArray.length; i++) {
        if (recentTransactionsArray[i].search(userId + "> gained") < 0) { // Search for a message about this user gaining interest
            continue;
        }

        let thisTransactionText = recentTransactionsArray[i];

        // Update timestamp
        thisTransactionText = "<t:" + (Date.now() / 1000).toString + thisTransactionText.substring(thisTransactionText.search(":f>"));

        if (thisTransactionText.search(emote) < 0) {
            let emotePosition = thisTransactionText.search("<:");

            thisTransactionText = thisTransactionText.substring(0, emotePosition) + emote + ", " + thisTransactionText.substring(emotePosition);
        }

        let boffoPosition = thisTransactionText.search("₿");
        let interestAmount = parseInt(thisTransactionText.substring(boffoPosition).match(/\d/g).join("")) + 1;
        thisTransactionText = thisTransactionText.substring(0, boffoPosition + 1) + interestAmount + ".";

        for (let j = i; j > 1; j--) {
            recentTransactionsArray[j] = recentTransactionsArray[j - 1];
        }
        recentTransactionsArray[1] = thisTransactionText;

        transactionHistoryMessage.edit(recentTransactionsArray.join("\n\n"));
        return;
    }

    // If we make it here, there wasn't an interest message to update
    addToTransactionHistory("<@" + userId + "> gained interest from " + emote + ": ₿1.");
}

async function checkForEmotes(message: Message) {
    const emotes = message.content.match(/<:.+?:\d+>/g);
    if (emotes == null) {
        return;
    }
    
    for (let i = 0; i < emotes.length; i++) {
        if (message.member) {
            await giveEmoteOwnerRoyalties(emotes[i], message.member.id);
        }
    }
}

// Helper function to easily fetch the general channel and send a message
async function sendToGeneralChannel(message: string) {
    const generalChannel = await client.channels.fetch(generalChannelId) as TextChannel;
    await generalChannel.send(message);
}

client.on(Events.InteractionCreate, async (interaction) => {
    const member = interaction.member as GuildMember
    const userId = member.id;

    if (interaction.isButton()) {
        const userDisplayName = member.displayName;
        
        const customId = (interaction.component as ButtonComponent).customId
        
        if (customId === "addToWheelButton") {
            if (getBalanceForUser(userId) < 100) {
                sendToGeneralChannel(userDisplayName + " can't afford to add a movie to the wheel!");
                return;
            }

            const modal = new ModalBuilder()
                .setCustomId("addToWheelModal")
                .setTitle("Add a movie to the wheel");

            const movieTitleInput = new TextInputBuilder()
                .setCustomId("addToWheelMovieTitleTextInput")
                .setStyle(TextInputStyle.Short)
                .setPlaceholder("Gooby");

            const movieTitleLabel = new LabelBuilder()
                .setLabel("What movie will you add to the wheel?")
                .setTextInputComponent(movieTitleInput);

            modal.addLabelComponents(movieTitleLabel);

            // Show the modal
            await interaction.showModal(modal);

        } else if (customId === "yourChoiceNextButton") {
            if (getBalanceForUser(userId) < 200) {
                sendToGeneralChannel(userDisplayName + " can't afford to choose next week's movie!");
                return;
            }

            const modal = new ModalBuilder()
                .setCustomId("chooseNextMovieModal")
                .setTitle("Choose The Next Movie");

            const movieTitleInput = new TextInputBuilder()
                .setCustomId("chooseNextMovieTextInput")
                .setStyle(TextInputStyle.Short)
                .setPlaceholder("Gooby");

            const movieTitleLabel = new LabelBuilder()
                .setLabel("What movie will we watch next?")
                .setTextInputComponent(movieTitleInput);

            modal.addLabelComponents(movieTitleLabel);

            // Show the modal
            await interaction.showModal(modal);
            
        } else if (customId === "vetoButton") {
            if (getBalanceForUser(userId) < 300) {
                sendToGeneralChannel(userDisplayName + " failed to veto this week's movie because they're too broke! Embarrassing!!!");
                return;
            }

            const vetoConfirmButton = new ButtonBuilder()
                .setCustomId("vetoConfirmButton")
                .setLabel("Yes")
                .setStyle(ButtonStyle.Danger);

            const vetoCancelButton = new ButtonBuilder()
                .setCustomId("vetoCancelButton")
                .setLabel("No")
                .setStyle(ButtonStyle.Secondary);

            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(vetoConfirmButton, vetoCancelButton);

            const response = await interaction.reply({
                content: "<@" + userId + "> are you sure you want to veto this week's movie?",
                components: [row],
                flags: MessageFlags.Ephemeral,
                withResponse: true
            });

            try {
                const confirmation = await response.resource?.message?.awaitMessageComponent({ filter: i => i.user.id === interaction.user.id, time: 60000 }) as ButtonInteraction;
                
                if (confirmation.customId === 'vetoConfirmButton' && getBalanceForUser(userId) >= 300) {
                    addToBalanceForUserId(userId, -300);
                    await confirmation.update({ content: "Purchase successful! This message will auto delete <t:" + (Date.now() / 1000 + 10).toString + ":R>", components: [] }).then(confirmationMessage => {setTimeout(() => confirmationMessage.delete(), 9500)});

                    addToTransactionHistory("<@"+userId+"> paid ₿300 to veto this week's movie.");

                    await sendToGeneralChannel("<@" + userId + "> has paid ₿300 to veto this week's movie!");
                    
                } else if (confirmation.customId === 'vetoCancelButton') {
                    await confirmation.update({ content: 'Veto cancelled.', components: [] }).then(confirmationMessage => {setTimeout(() => confirmationMessage.delete(), 10000)});
                }
            } catch (e) {
                await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling.', components: [] });
            }
        } else if (customId === "joeAttendsButton") {
            if (getBalanceForUser(userId) < joeAttendanceCost) {
                sendToGeneralChannel(userDisplayName + " can't afford to be friends with <@" + process.env.joeUserId + ">");
                return;
            }
            const joeUserId = process.env.joeUserId;
            if (!joeUserId) { return; }
            let joeUser = interaction.guild?.members.cache.get(joeUserId) ?? (await interaction.guild?.members.fetch().then(serverMembers => { joeUser = serverMembers.get(joeUserId); })); // If the user is not cached, try to fetch it
            if (!joeUser) { return; }
            const joeDisplayName = joeUser.displayName

            const joeConfirmButton = new ButtonBuilder()
                .setCustomId("joeConfirmButton")
                .setLabel("Yes")
                .setStyle(ButtonStyle.Success);

            const joeCancelButton = new ButtonBuilder()
                .setCustomId("joeCancelButton")
                .setLabel("No, I don't like " + joeDisplayName)
                .setStyle(ButtonStyle.Secondary);

            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(joeConfirmButton, joeCancelButton);

            const response = await interaction.reply({
                content: "<@" + userId + "> do you want to pay ₿" + joeAttendanceCost + " to hang out with " + joeDisplayName + "?",
                components: [row],
                flags: MessageFlags.Ephemeral,
                withResponse: true
            });

            try {
                const confirmation = await response.resource?.message?.awaitMessageComponent({ filter: i => i.user.id === interaction.user.id, time: 60000 }) as ButtonInteraction;

                if (confirmation.customId === 'joeConfirmButton' && getBalanceForUser(userId) >= joeAttendanceCost) {
                    addToBalanceForUserId(userId, -joeAttendanceCost);
                    addToBalanceForUserId(joeUserId, joeAttendanceCost)
                    await confirmation.update({ content: "Purchase successful! This message will auto delete <t:" + (Date.now() / 1000 + 10).toString + ":R>", components: [] }).then(confirmationMessage => {setTimeout(() => confirmationMessage.delete(), 9500)});

                    addToTransactionHistory("<@"+userId+"> paid ₿" + joeAttendanceCost + " to hang out with <@" + joeUserId + ">. " + joeDisplayName + " receives ₿5.");

                    await sendToGeneralChannel("<@"+userId+"> has paid ₿" + joeAttendanceCost + " to hang out with <@" + joeUserId + ">! " + joeDisplayName + "'s attendance is mandatory next movie night.");
                    
                } else if (confirmation.customId === 'joeCancelButton') {
                    await confirmation.update({ content: joeDisplayName+" hangout cancelled.", components: [] }).then(confirmationMessage => {setTimeout(() => confirmationMessage.delete(), 10000)});
                }
            } catch (e) {
                await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling.', components: [] });
            }
        }
    } else if (interaction.isModalSubmit()) {

        if (interaction.customId == "addToWheelModal") {
            const movieTitle = interaction.fields.getTextInputValue("addToWheelMovieTitleTextInput");

            addToBalanceForUserId(userId, -100);
            sendToGeneralChannel("<@"+userId+"> paid ₿100 to add " + movieTitle + " to the wheel!");
            addToTransactionHistory("<@"+userId+"> paid ₿100 to add " + movieTitle + " to the wheel.");
            interaction.reply({content:"Purchase successful! This message will auto delete <t:" + (Date.now() / 1000 + 10).toString + ":R>", flags: MessageFlags.Ephemeral}).then(confirmationMessage => {setTimeout(() => confirmationMessage.delete(), 9500)});
        } else if (interaction.customId == "chooseNextMovieModal") {
            const movieTitle = interaction.fields.getTextInputValue("chooseNextMovieTextInput");

            addToBalanceForUserId(userId, -200);
            sendToGeneralChannel("<@"+userId+"> paid ₿200 for us to watch " + movieTitle + " next movie night!");
            addToTransactionHistory("<@"+userId+"> paid ₿200 for us to watch " + movieTitle + " next movie night.");
            interaction.reply({content:"Purchase successful! This message will auto delete <t:" + (Date.now() / 1000 + 10).toString + ":R>", flags: MessageFlags.Ephemeral}).then(confirmationMessage => {setTimeout(() => confirmationMessage.delete(), 9500)});
        }
    } else if (interaction.isChatInputCommand()) {
        if (!chatCommands.has(interaction.commandName)) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        //
        // Boffo commands
        //
        if (interaction.commandName == "tip") {
            const fromUser = interaction.member as GuildMember;
            const toUser = interaction.guild?.members.cache.get(interaction.options?.getUser("recipient")?.id ?? '');
            const amount = interaction.options.getInteger("amount");
            if (fromUser && toUser && amount) {
                tip(fromUser, toUser, amount, interaction)
            }
            return;

        } else if (interaction.commandName == "bid") {
            const biddingUser = interaction.member as GuildMember;
            let emoteToBuy = interaction.options.getString("emote") ?? '';
            emoteToBuy = emoteToBuy.substring(emoteToBuy.search("<"),emoteToBuy.search(">") + 1);
            const bidAmount = interaction.options.getInteger("amount");
            if (biddingUser && bidAmount) {
                bid(biddingUser, emoteToBuy, bidAmount, interaction);
            }
            return;

        } else if (interaction.commandName == "bonus") {
            let fromUser = interaction.member as GuildMember;
            let toUser = interaction.guild?.members.cache.get(interaction.options?.getUser("recipient")?.id ?? '');
            let amount = interaction.options.getInteger("amount");
            if (fromUser && toUser && amount) {
                bonus(fromUser.id, toUser, amount, interaction)
            }
            return;

        //
        // Gun commands
        //
        } else if (interaction.commandName == "shoot") {
            let target = interaction.guild?.members.cache.get(interaction.options?.getUser("target")?.id ?? '')
            if (target) {
                shoot(target, member, interaction, 15 * 1000, 50)
            }
            return;

        } else if (interaction.commandName == "kill") {
            let target = interaction.guild?.members.cache.get(interaction.options?.getUser("target")?.id ?? '')
            if (target) {
                shoot(target, interaction.member as GuildMember, interaction, 60 * 1000, 100)
            }
            return;

        //
        // Scoreboard updates
        //
        } else if (interaction.commandName == "add") {
            if (interaction.channelId != scoreboardChannelId) {
                interaction.reply({content:"This command can only be used in the scoreboard channel.", flags: MessageFlags.Ephemeral})
                return;
            }
            
            let movieTitle = interaction.options.getString("movie");
            let rank = interaction.options.getInteger("rank");
            if (movieTitle && rank) {
                addMovieToScoreboard(rank, movieTitle, userId, interaction);
            }
            return;

        } else if (interaction.commandName == "remove") {
            if (interaction.channelId != scoreboardChannelId) {
                interaction.reply({content:"This command can only be used in the scoreboard channel.", flags: MessageFlags.Ephemeral})
                return;
            } 
            let rank = interaction.options.getInteger("rank");
            if (rank) {
                removeMovieFromScoreboard(rank, interaction);
            }
            return;

        } else if (interaction.commandName == "update") {
            if (interaction.channelId != scoreboardChannelId) {
                interaction.reply({content:"This command can only be used in the scoreboard channel.", flags: MessageFlags.Ephemeral})
                return;
            } 
            let currentRank = interaction.options.getInteger("currentrank");
            let newRank = interaction.options.getInteger("newrank");
            let newTitle = interaction.options.getString("newtitle");
            if (currentRank && newRank && newTitle) {
                updateMovieRankOnScoreboard(currentRank, newRank, newTitle, interaction);
            }
            return;
        }
    }
});

client.on('messageCreate', async (msg) => {
    if (msg.content.charAt(0) != '~' &&
        (msg.author.id != process.env.gunUserId || msg.content.search("acquires") < 0)) {
        await checkForEmotes(msg);
        return;
    }
    
    if (msg.content.startsWith("~delete")) {
        if (msg.author.id != process.env.lenaUserId && msg.author.id != process.env.benUserId) {
            return;
        }
        if (msg.reference && msg.reference.messageId) {
            msg.channel.messages.fetch(msg.reference.messageId).then( message => message.delete());
        }
        msg.delete();
        return;
    }
    /*
    if (msg.content.startsWith("~bid")) {
        const biddingUser = msg.member;
        const emoteToBuy = msg.content.substring(msg.content.search("<"), msg.content.search(">") + 1);
        let bidAmountString = msg.content.split(" ");
        let bidAmount = parseInt(bidAmountString[bidAmountString.length - 1].match(/\d/g)?.join("") ?? '');
        if (isNaN(bidAmount)) {
            msg.reply("Invalid amount! " + randomFaceEmote());
            return;
        }

        bid(biddingUser, emoteToBuy, bidAmount, msg);
        return;
    }

    if (msg.mentions.members && msg.mentions.members.size > 0) {
        if (msg.content.substring(1, 6).toLowerCase() === "shoot") {
            msg.channel.sendTyping();
            shootFromMessage(msg, 15 * 1000, 50);
        } else if (msg.content.substring(1, 5).toLowerCase() === "kill") {
            msg.channel.sendTyping();
            shootFromMessage(msg, 60 * 1000, 100);
        }

        if (msg.content.startsWith("~tip")) {
            msg.channel.sendTyping();
            const fromUser = msg.member;

            let amountToSendString = msg.content.split(" ");
            let amountToSend = parseInt(amountToSendString[amountToSendString.length - 1].match(/\d/g)?.join("") ?? '');

            if (isNaN(amountToSend)) {
                msg.channel.send("Invalid amount! " + randomFaceEmote());
                return;
            }

            const mentionedUsers = Array.from( msg.mentions.members.values() );
            for (let i = 0; i < mentionedUsers.length; i++) {
                const toUser = mentionedUsers[i];
                tip(fromUser, toUser, amountToSend, msg);
            }
            return;
        }

        if (msg.content.startsWith("~bonus")) {
            let amountToSendString = msg.content.split(" ");
            let amountToSend = parseInt(amountToSendString[amountToSendString.length - 1].match(/\d/g)?.join("") ?? '');
            bonus(msg.author.id, Array.from(msg.mentions.members.values()), amountToSend, msg)
            return;
        }
    }
    
    // These are the ~ versions of the scoreboard commands
    if (msg.channel.id === scoreboardChannelId) {
        let separatorPos = msg.content.search(" "); // The first space after the bot command
        if (separatorPos < 0) {
            return;
        }
        const movieEntry = msg.content.substring(separatorPos + 1); // The sent message with the bot command excluded

        if (msg.content.toLowerCase().startsWith("~add")) {
            separatorPos = movieEntry.search(" ");
            if (separatorPos < 0) {
                return;
            }

            const newMovieNumber = parseInt(movieEntry.substring(0, separatorPos).match(/\d/g)?.join("") ?? '');
            const newMovieTitle = movieEntry.substring(separatorPos + 1);
            await addMovieToScoreboard(newMovieNumber, newMovieTitle, msg.author.id, msg);
            msg.delete();
            return;

        } else if (msg.content.toLowerCase().startsWith("~remove")) {
            const movieNumber = movieEntry.match(/\d/g)?.join("");
            if (movieNumber) {
                await removeMovieFromScoreboard(movieNumber, msg);
            }
            msg.delete();
            return;
            
        } else if (msg.content.toLowerCase().startsWith("~update")) {
            separatorPos = movieEntry.search(" ");
            if (separatorPos < 0) {
                return;
            }
            const movieNumber = movieEntry.substring(0, separatorPos).match(/\d/g)?.join("");
            const newMovieTitle = movieEntry.substring(separatorPos + 1);

            if (movieNumber) {
                await updateMovieTitleOnScoreboard(movieNumber, newMovieTitle, msg);
            }
            msg.delete();
            return;

        } else {
            return;
        }
    }
    */
});

async function addMovieToScoreboard(newMovieNumber: number, newMovieTitle: string, userId: string, msg: ChatInputCommandInteraction) {
    let channel = msg.channel as TextChannel;
    channel.sendTyping();
    let movieCollection = await getMovieCollection(channel);
    if (movieCollection.length <= 50 || newMovieNumber > movieCollection.length + 1) {
        msg.reply("Error parsing the movie collection, canceling change.").then(errorMessage => {
            setTimeout(() => errorMessage.delete(), 10000)
        });
        return;
    }

    // Grant a bonus of ₿20 scaled based on how low the movie is being placed.
    //let bonusAmount = Math.round(20 * ((newMovieNumber - 1) / movieCollection.length))

    movieCollection.splice(newMovieNumber - 1, 0, newMovieNumber + ". " + newMovieTitle);
    for (let i = newMovieNumber; i < movieCollection.length; i++) {
        let separatorPos = movieCollection[i].indexOf(".");
        
        movieCollection[i] = (+i + +1) + movieCollection[i].substring(separatorPos);
    }

    // If Ben has added something to the scoreboard, everyone in voice gets their Boffo allowance
    let membersList = "";
    if (userId == process.env.benUserId) {
        membersList = await grantAllowance();
    }
    let confirmationText = "";
    if (membersList != "") {
        confirmationText = "Added " + newMovieTitle + " at rank " + newMovieNumber + ", and allowance granted to " + membersList + ".";
    } else {
        confirmationText = "Added " + newMovieTitle + " at rank " + newMovieNumber + ".";
    }

    await applyUpdatesToScoreboard(movieCollection, confirmationText, msg);
}

async function removeMovieFromScoreboard(movieNumber: number, msg: ChatInputCommandInteraction) {
    let channel = msg.channel as TextChannel;
    channel.sendTyping();
    let movieCollection = await getMovieCollection(channel);
    if (movieCollection.length <= 50) {
        msg.reply("Error parsing the movie collection, canceling change.").then(errorMessage => {
            setTimeout(() => errorMessage.delete(), 10000)
        });
        return;
    } else if (movieNumber > movieCollection.length || movieNumber < 0) {
        msg.reply("Provided rank is not within the bounds of the scoreboard.").then(errorMessage => {
            setTimeout(() => errorMessage.delete(), 10000)
        });
        return;
    }

    let removedMovieName = movieCollection[movieNumber - 1];
    movieCollection.splice(movieNumber - 1, 1);
    for (let i = movieNumber - 1; i < movieCollection.length; i++) {
        let separatorPos = movieCollection[i].indexOf(".");
        
        movieCollection[i] = (+i + +1) + movieCollection[i].substring(separatorPos);
    }

    let confirmationText = "Removed rank #" + removedMovieName + ".";
    await applyUpdatesToScoreboard(movieCollection, confirmationText, msg);
}

async function updateMovieTitleOnScoreboard(movieNumber: number, newMovieTitle: string, msg: ChatInputCommandInteraction) {
    let channel = msg.channel as TextChannel;
    channel.sendTyping();
    let movieCollection = await getMovieCollection(channel);
    if (movieCollection.length <= 50) {
        msg.reply("Error parsing the movie collection, canceling change.").then(errorMessage => {
            setTimeout(() => errorMessage.delete(), 10000)
        });
        return;
    }

    const oldMovieTitle = movieCollection[movieNumber - 1];

    movieCollection[movieNumber - 1] = movieNumber + ". " + newMovieTitle;

    let confirmationText = "Updated rank #" + oldMovieTitle + " to " + newMovieTitle + ".";
    await applyUpdatesToScoreboard(movieCollection, confirmationText, msg);
}

async function updateMovieRankOnScoreboard(oldRank: number, newRank: number, newMovieTitle: string, msg: ChatInputCommandInteraction) {
    if (!newRank && !newMovieTitle) {
        msg.reply("Please supply an updated title / rank.").then(errorMessage => {
            setTimeout(() => errorMessage.delete(), 10000)
        });
        return;
    }
    let channel = msg.channel as TextChannel;
    channel.sendTyping();
    let movieCollection = await getMovieCollection(channel);
    if (movieCollection.length <= 50) {
        msg.reply("Error parsing the movie collection, canceling change.").then(errorMessage => {
            setTimeout(() => errorMessage.delete(), 10000)
        });
        return;
    }

    const oldMovieTitle = movieCollection[oldRank - 1].substring(movieCollection[oldRank - 1].indexOf(".") + 2);
    if (!newMovieTitle) {
        newMovieTitle = oldMovieTitle;
    }

    if (!newRank || oldRank === newRank) {
        await updateMovieTitleOnScoreboard(oldRank, newMovieTitle, msg);
        return;
    } else if (newRank < oldRank) {
        movieCollection.splice(oldRank - 1, 1);
        movieCollection.splice(newRank - 1, 0, newRank + ". " + newMovieTitle);
    } else {
        movieCollection.splice(newRank - 1, 0, newRank + ". " + newMovieTitle);
        movieCollection.splice(oldRank - 1, 1);
    }
    
    for (let i = Math.min(oldRank, newRank) - 1; i < Math.max(oldRank, newRank) - 1; i++) {
        let separatorPos = movieCollection[i].indexOf(".");
        
        movieCollection[i] = (+i + +1) + movieCollection[i].substring(separatorPos);
    }

    let confirmationText = "Updated rank #" + oldRank + ". " + oldMovieTitle + " to #" + newRank + ". " + newMovieTitle + ".";
    await applyUpdatesToScoreboard(movieCollection, confirmationText, msg);
}

async function applyUpdatesToScoreboard(newMovieCollection: string[], confirmationText: string, msg: ChatInputCommandInteraction) {
    let archiveChannel = await client.channels.fetch(scoreboardArchiveChannelId) as TextChannel;

    // Every 5 updates, dump the entire scoreboard into the archive
    let scoreboardNeedsArchive = true
    const messages = await archiveChannel.messages.fetch({ limit: 10 }); // Check last 10 messages
    for( let message of messages ) {
        let content = message[1].content
        if (content.indexOf("Scoreboard updated: ") < 0) {
            scoreboardNeedsArchive = false;
            break;
        }
    }

    await archiveChannel.send("Scoreboard updated: " + confirmationText);
    await updateScoreBoard(newMovieCollection, msg.channel as TextChannel, scoreboardNeedsArchive, archiveChannel);
    await msg.reply({content: confirmationText, flags: MessageFlags.Ephemeral}).then(confirmationMessage => {
        setTimeout(() => confirmationMessage.delete(), 10000)
    });
    await sendToGeneralChannel("Scoreboard updated: " + confirmationText);
}

client.on('voiceStateUpdate', async (oldState, newState) => {
    if (newState.streaming && newState.channel != null && !oldState.streaming) {
        const currentTimestamp = Date.now();
        const generalChannel = await client.channels.fetch(generalChannelId) as TextChannel;
        const messages = await generalChannel.messages.fetch({ limit: 15 }); // Check last 15 messages

        const goneLiveMessageText = newState.member?.displayName + " has gone live!";
        for( let message of messages ) {
            if (currentTimestamp - message[1].createdTimestamp > 4 * 60 * 60 * 1000) { // Check last four hours
                break;
            }
            if (message[1].author.id === process.env.gunUserId && message[1].content.startsWith(goneLiveMessageText)) {
                return;
            }
        }
        generalChannel.send(goneLiveMessageText);
    }
});

client.on(Events.GuildEmojiDelete, async (emoji) => {
    let emoteId = emoji.id;
    let emoteName = emoji.name;

    let emoteFullName = "<:" + emoteName + ":" + emoteId + ">";
    // If the emoji being deleted is owned, remove it from the ownership map
    if (emoteOwnershipMap.has(emoteFullName)) {
        
        // Post the emote's value, and the previous owner
        const emoteProperties = emoteOwnershipMap.get(emoteFullName);
        if (emoteProperties == null) { return; }
        const generalChannel = await client.channels.fetch(generalChannelId) as TextChannel;
        generalChannel.send("<@" + emoteProperties.owner + "> lost ₿" + emoteProperties.value + " from the removal of :" + emoteName + ":!");
        
        emoteOwnershipMap.delete(emoteFullName);
        updateEmoteOwnershipMessage();
    }
});

async function grantAllowance() {
    let voiceChannel = await client.channels.fetch(voiceChannelId) as VoiceChannel;
    let membersArray = Array.from(voiceChannel.members.values());
    let membersList = "";
    for (let i = 0; i < membersArray.length; i++) {
        if (i > 0) {
            if (i == membersArray.length - 1) {
                membersList += " & ";
            } else {
                membersList += ", ";
            }
        }
        membersList += membersArray[i].displayName;
        addToBalanceForUserId(membersArray[i].id, 10);
    }
    if (membersArray.length > 0) {
        addToTransactionHistory(membersList + " got their ₿10 allowance.");
    }
    return membersList;
}

client.on('messageReactionAdd', async(reaction, user) => {
    if (reaction.message.author?.id != user.id && reaction.emoji.id){
        giveEmoteOwnerRoyalties("<:" + reaction.emoji.name + ":" + reaction.emoji.id + ">", user.id);
    }
});

async function giveEmoteOwnerRoyalties(emoteId: string, userId: string) {
    if (!emoteOwnershipMap.has(emoteId)) {
        return;
    }

    const emoteOwner = emoteOwnershipMap.get(emoteId)?.owner;
    if (emoteOwner == null || emoteOwner == userId) {
        return;
    } else {
        addToBalanceForUserId(emoteOwner, 1);
        trackInterestInTransactionHistory(emoteOwner, emoteId);
    }
}

// function shootFromMessage(msg: Message, timeoutDuration: number, cost: number) {
//     const membersCollection = msg.mentions.members;
//     if (membersCollection && msg.member) {
//         shoot([...membersCollection.values()], msg.member, msg, timeoutDuration, cost);
//     }
// }

function shoot(target: GuildMember, shooter: GuildMember, msg: ChatInputCommandInteraction, timeoutDuration: number, cost: number) {
    let backfire = false;
    let shootMessage = randomFaceEmote();
    let tagMessage = "";

    let shooterBalance = getBalanceForUser(shooter.id);

    const targets = [target]; // Holdover from when it was possible to shoot multiple users at once

    targets.forEach( mentionedMember => {
        if (mentionedMember.id == process.env.benUserId || mentionedMember.id == process.env.gunUserId || shooterBalance < cost) {
          if (shooter.id == process.env.benUserId || shooter.id == process.env.gunUserId) {
                return;
            } else {
                shooter.timeout(timeoutDuration * 2);
                tagMessage = "<@" + shooter.id + ">";
                backfire = true;
            }
        } else {
            if (tagMessage != "") {
                tagMessage += " ";
            }
            tagMessage += "<@" + mentionedMember.id + ">";
            mentionedMember.timeout(timeoutDuration);
        }
        shootMessage = gunEmote + shootMessage;
        if (backfire || timeoutDuration > 20 * 1000) {
            shootMessage = shootMessage + gunEmote2;
        }
    });
    if (tagMessage != '') { // Cancel out if there are no tags
        if (backfire) {
            msg.reply("Gun backfired!");
            addToTransactionHistory("<@" + shooter.id + ">'s gun backfired!");
        } else {
            addToBalanceForUserId(shooter.id, -cost);
            let transactionText = shooter.displayName + " paid ₿" + cost + " to shoot " + tagMessage + ".";
            msg.reply(transactionText + " " + shooter.displayName + "'s new balance: ₿" + getBalanceForUser(shooter.id) + ".");
            addToTransactionHistory(transactionText);
        }
        let channel = msg.channel as TextChannel;
        channel.send(tagMessage);
        channel.send(shootMessage);
    }
}

async function updateScoreBoard(movieCollection: string[], channel: TextChannel, needsArchive: boolean, archiveChannel: TextChannel) {
    let scoreboardMessageIndex = 0;
    let scoreboardMessageContent = "";
    let scoreboardMessageCharCount = 0;

    for (let i = 0; i < movieCollection.length; i++) {
        if (scoreboardMessageCharCount + movieCollection[i].length + 1 > 2000) {
            await channel.messages.fetch(scoreboardMessageIds[scoreboardMessageIndex]).then( message => {
                if (needsArchive) { archiveChannel.send(message.content); }
                message.edit(scoreboardMessageContent);
            });

            scoreboardMessageIndex++;
            scoreboardMessageContent = "";
            scoreboardMessageCharCount = 0;
            if (scoreboardMessageIndex >= scoreboardMessageIds.length) {
                return;
            }
        }
        if (scoreboardMessageCharCount > 0) {
            scoreboardMessageContent += "\n"; // Newline only counts as one character
            scoreboardMessageCharCount += 1;
        }

        scoreboardMessageContent += movieCollection[i];
        scoreboardMessageCharCount += movieCollection[i].length;
    }

    channel.messages.fetch(scoreboardMessageIds[scoreboardMessageIndex]).then( message => {
        if (needsArchive) { archiveChannel.send(message.content); }
        message.edit(scoreboardMessageContent);
    });
}

function randomFaceEmote() {
    const faceEmotes = client.emojis.cache.filter((emoji) => !nonFaceEmotes.includes(emoji.id)).map(filteredEmoji => "<:" + filteredEmoji.name + ":" + filteredEmoji.id + ">");
    
    let min = Math.ceil(0);
    let max = Math.floor(faceEmotes.length);
    let index = Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
    return faceEmotes[index];
}

function tip(fromUser: GuildMember, toUser: GuildMember, amountToSend: number, msg: ChatInputCommandInteraction) {
    let fromUserBalance = getBalanceForUser(fromUser.id);
    let toUserBalance = getBalanceForUser(toUser.id);
    
    amountToSend = Math.round(amountToSend);

    if (amountToSend > fromUserBalance) {
        msg.reply("You only have ₿" + fromUserBalance + "! " + randomFaceEmote());
        return;
    } else if (fromUser.id == toUser.id) {
        msg.reply("~shoot <@" + fromUser.id + ">");
        return;
    } else if (amountToSend == 0) {
        msg.reply("You gotta tip more than ₿0 " + randomFaceEmote());
        return;
    } else if (fromUserBalance == 0) {
        msg.reply("You can't tip with no Boffos! " + randomFaceEmote() + "\nCurrent balance: ₿" + fromUserBalance);
        return;
    }

    let yoinkText = "";
    // If yoinking, 50/50 chance to actually tip double
    if (amountToSend < 0) {
        if (Math.floor(Math.random() * 2) >= 1) {
            amountToSend = Math.min(fromUserBalance, Math.abs(amountToSend * 2));
            yoinkText = "# REVERSE YOINK\n";
        } else {
            amountToSend = Math.max(amountToSend, -toUserBalance, -fromUserBalance);
            yoinkText = "# YOINK\n";
        }
    }

    fromUserBalance -= amountToSend;
    toUserBalance += amountToSend;

    updateBalanceForUserId(fromUser.id, fromUserBalance);
    updateBalanceForUserId(toUser.id, toUserBalance);
    msg.reply(yoinkText + fromUser.displayName + " sends <@" + toUser.id + "> ₿" + amountToSend + ".\n" + fromUser.displayName + "'s balance: ₿" + fromUserBalance + "\n" + toUser.displayName + "'s balance: ₿" + toUserBalance);
    addToTransactionHistory(fromUser.displayName + " sent " + toUser.displayName + " ₿" + amountToSend.toLocaleString("en-US") + ".");
}

function bonus(fromUserId: string, toUser: GuildMember, amountToSend: number, msg: ChatInputCommandInteraction) {
    if (fromUserId != process.env.lenaUserId && fromUserId != process.env.benUserId) {
        const member = msg.member as GuildMember;
        shoot(member, member, msg, 15 * 1000, 0);
        return;
    }

    if (isNaN(amountToSend)) {
        msg.reply("Invalid amount! " + randomFaceEmote());
        return;
    }

    //for (let i = 0; i < toUsers.length; i++) {
    //    const toUser = toUsers[i];

    addToBalanceForUserId(toUser.id, amountToSend);
    msg.reply("Added ₿" + amountToSend.toLocaleString("en-US") + " to " + toUser.displayName + "'s balance.\nNew current balance: ₿" + getBalanceForUser(toUser.id).toLocaleString("en-US") + ".");
    //}
}

function bid(biddingUser: GuildMember, emoteToBuy: string, bidAmount: number, msg: ChatInputCommandInteraction) {
    if (emoteToBuy == "") {
        return;
    } else if (emoteToBuy == gunEmote || emoteToBuy == gunEmote2) {
        if (biddingUser.id != process.env.benUserId) {
            msg.reply("~shoot");
        }
        return;
    }
    let emoteId = emoteToBuy.substring(3);
    emoteId = emoteId.substring(emoteId.search(":") + 1, emoteId.search(">"));

    let serverEmote = client.emojis.cache.find(emoji => emoji.id == emoteId);
    if (serverEmote == null || !serverEmote.available) {
        if (biddingUser.id != process.env.benUserId) {
            msg.reply("~shoot");
        }
        return;
    }
    const channel = msg.channel as TextChannel;
    channel.sendTyping();
    // verify user has enough ₿ to bid on emote
    let biddingUserBalance = getBalanceForUser(biddingUser.id);

    if (bidAmount > biddingUserBalance) {
        msg.reply("Insufficient funds! " + randomFaceEmote());
        return;
    }

    // find current ownership
    let previousOwner;
    if (emoteOwnershipMap.has(emoteToBuy)) {
        const currentEmoteProperties = emoteOwnershipMap.get(emoteToBuy);

        if (!currentEmoteProperties || currentEmoteProperties.owner == biddingUser.id) {
            return;
        }
        // Make sure new user can afford
        if (currentEmoteProperties.value >= bidAmount) {
            msg.reply("Bid amount must be higher than ₿" + currentEmoteProperties.value + "! " + randomFaceEmote());
            return;
        }

        previousOwner = currentEmoteProperties.owner;
        addToBalanceForUserId(previousOwner, currentEmoteProperties.value);
    }

    emoteOwnershipMap.set(emoteToBuy, {id: emoteToBuy, owner: biddingUser.id, value: bidAmount});

    // update the ownership message
    updateEmoteOwnershipMessage();

    // charge bidder
    addToBalanceForUserId(biddingUser.id, -bidAmount);
    // refund old owner
    if (previousOwner != null) {
        msg.reply(biddingUser.displayName + " acquires " + emoteToBuy + " from <@" + previousOwner + "> for ₿" + bidAmount + "!");
        addToTransactionHistory(biddingUser.displayName + " acquired " + emoteToBuy + " from <@" + previousOwner + "> for ₿" + bidAmount + ".");
    } else {
        msg.reply(biddingUser.displayName + " acquires " + emoteToBuy + " for ₿" + bidAmount + "!");
        addToTransactionHistory(biddingUser.displayName + " acquired " + emoteToBuy + " for ₿" + bidAmount + ".");
    }
}
