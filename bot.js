const fs = require('node:fs');
const path = require('node:path');
const { Client, Events, GatewayIntentBits, ButtonBuilder, ActionRowBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.GuildEmojisAndStickers] });
require('dotenv').config();
// const wait = require('util').promisify(setTimeout); // can use this to wait(1000) if need

const gunEmote = "<:kaboom:938830966800150539>";
const gunEmote2 = "<:kaboom2:938856552532676678>";
const nonFaceEmotes = [
    "938830966800150539", // gunEmote (kaboom)
    "938856552532676678", // gunEmote (kaboom2)
    "790367046868140053", // dunkaccino
    "872580606339469404" // escape (leave server)
];

const gunUserId = "938529523811627038";
const benUserId = "410621256140980225";
const geneUserId = "282597947064057856";
const generalChannelId = "702142443608473602";
const suggestionsChannelId = "704484111967846452";
const scoreboardChannelId = "712134924815040522";
const scoreboardArchiveChannelId = "1246524630034808893";
const ledgerChannelId = "1072168363129835560";
const voiceChannelId = "702142443608473603";
const emoteOwnershipMessageId = "1072279118944673872";
const transactionHistoryMessageId = "1072279127291334767";
const serverId = "702142442949967953";

const scoreboardMessageIds = [
    "1047313677956681820",
    "1047313679147864114",
    "1047313680502628382",
    "1047313681647673384",
    "1047313682637537320"
];

const boffoBalanceIDsMap = new Map([ // User ID, balance post ID
    ["410621256140980225", "1072279148246081637"], // Ben
    ["206973395517177856", "1072279160908681286"], // John
    ["424031474661064715", "1072279173168631839"], // Adam
    ["206975381067137025", "1072279186032558110"], // Dylan F
    ["701085890117632075", "1072279198665814056"], // Garrett
    ["282597947064057856", "1072279211437465640"], // Gene
    ["281984105523183616", "1072279223840022568"], // Nathaniel
    ["746882782596431872", "1072279236355833917"], // Maren
    ["206968933725503488", "1072279248938746017"], // Joe
    ["209463935009685506", "1072279261584576584"], // Ted
    ["153288298255613953", "1149063892807450758"] // Dylan Landry
]);

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// Set a new item in the Collection with the key as the command name and the value as the exported module
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

function Emote(id, owner, value) {
    this.id = id;
    this.owner = owner;
    this.value = value;
}

var emoteOwnershipMap = new Map();
var accountBalancesMap = new Map();

client.login(process.env.token);

async function initializeStore() { // Used for initializing or editing any template messages on startup
    const ledgerChannel = await client.channels.fetch(ledgerChannelId);

    const addToWheelButton = new ButtonBuilder()
                            .setCustomId("addToWheelButton")
                            .setLabel("(₿100) Add any movie to the wheel immediately")
                            .setStyle(ButtonStyle.Primary);

    const yourChoiceNextButton = new ButtonBuilder()
                                .setCustomId("yourChoiceNextButton")
                                .setLabel("(₿200) You choose the movie for next movie night")
                                .setStyle(ButtonStyle.Success);

    const vetoButton = new ButtonBuilder()
                           .setCustomId("vetoButton")
                           .setLabel("(₿300) Veto this week's movie")
                           .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(addToWheelButton, yourChoiceNextButton, vetoButton);
    
    ledgerChannel.send({content: "**~The ₿offo Boutique~**", components:[row]});
}

async function initializeNewAccount() {
    const ledgerChannel = await client.channels.fetch(ledgerChannelId);
    const newUserId = '153288298255613953';

    await ledgerChannel.send("**~The Bank of ₿offos~\n  ~Canadian Branch~**\n~~                                          ~~");

    await ledgerChannel.send('<@' + newUserId + '>:');

    await ledgerChannel.send('₿100'); // Remember to get this message id and add it to boffoBalanceIDsMap
    
    await ledgerChannel.send("~~                                          ~~");
}

client.on('ready', () => {
    // initializeStore();
    initializeAccountBalances();
    initializeEmoteOwnership();
    console.log(`Logged in as ${client.user.tag}!`);
});

// Copy/Paste point

async function initializeAccountBalances() {
    const ledgerChannel = await client.channels.fetch(ledgerChannelId);

    const users = Array.from(boffoBalanceIDsMap.keys());
    for (let i = 0; i < users.length; i++) {
        const message = await ledgerChannel.messages.fetch(boffoBalanceIDsMap.get(users[i]));
        const balanceNumber = message.content.substring(1).match(/\d/g).join("");
        accountBalancesMap.set(users[i], parseInt(balanceNumber));
    };
}

async function initializeEmoteOwnership() {
    const emoteOwnershipMessage = await getEmoteOwnershipMessage();
    var emoteOwnershipMessageContent = emoteOwnershipMessage.content.split("\n");
    
    for (let i = 0; i < emoteOwnershipMessageContent.length; i++) {
        
        var thisOwnershipLine = emoteOwnershipMessageContent[i];
        if (!thisOwnershipLine.startsWith("<@")) {
            continue;
        }

        var emoteOwnerId = thisOwnershipLine.substring(2, thisOwnershipLine.search(">"));

        const emotes = thisOwnershipLine.match(/<:.+?:\d+>/g);

        if (emotes == null) {
            continue;
        }
        for (let j = 0; j < emotes.length; j++) {
            const emoteStringIndex = thisOwnershipLine.search(emotes[j]);
            // find emote price
            var emotePrice = thisOwnershipLine.substring(emoteStringIndex + emotes[j].length + 1);
            var regExp = /\(([^)]+)\)/;
            emotePrice = regExp.exec(emotePrice)[1];
            emotePrice = parseInt(emotePrice.match(/\d/g).join(""));

            emoteOwnershipMap.set(emotes[j], new Emote(emotes[j], emoteOwnerId, emotePrice));
        }
    }
}

async function getMovieCollection(channel) {
    const message = await channel.messages.fetch(scoreboardMessageIds[0]);
    var movieCollection = message.content.split("\n");

    for (let i = 1; i < scoreboardMessageIds.length; i++) {
        const message2 = await channel.messages.fetch(scoreboardMessageIds[i]);
        if (!message2.content.startsWith("List Part ")) {
            movieCollection = [...movieCollection, ...message2.content.split("\n")];
        }
    }

    return movieCollection;
}

function updateBalanceForUserId(userId, newBalance) {
    accountBalancesMap.set(userId, newBalance);

    updateBalancePostForUserId(userId);
}

function addToBalanceForUserId(userId, amountToAdd) {
    if (!accountBalancesMap.has(userId)) {
        return;
    }

    let newBalance = accountBalancesMap.get(userId) + amountToAdd;
    accountBalancesMap.set(userId, newBalance);

    updateBalancePostForUserId(userId);
}

async function updateBalancePostForUserId(userId) {
    const ledgerChannel = await client.channels.fetch(ledgerChannelId);
    await ledgerChannel.messages.fetch(boffoBalanceIDsMap.get(userId)).then( message => message.edit(content="₿" + accountBalancesMap.get(userId).toLocaleString("en-US")));
}

async function getEmoteOwnershipMessage() {
    const ledgerChannel = await client.channels.fetch(ledgerChannelId);
    const message = await ledgerChannel.messages.fetch(emoteOwnershipMessageId);

    return message;
}

async function updateEmoteOwnershipMessage() {
    const ownershipMessage = await getEmoteOwnershipMessage();

    var ownersMap = new Map();
    emoteOwnershipMap.forEach(emote => {
        if (ownersMap.has(emote.owner)) {
            var ownershipLine = ownersMap.get(emote.owner) + " | " + emote.id + " (₿" + emote.value + ")";
            ownersMap.set(emote.owner, ownershipLine);
        } else {
            ownersMap.set(emote.owner, "<@" + emote.owner + ">'s emotes: " + emote.id + " (₿" + emote.value + ")");
        }
    });
    var ownersArray = Array.from(ownersMap.values());
    ownershipMessage.edit(ownersArray.join("\n"));
}

async function addToTransactionHistory(transactionToAdd) {
    const ledgerChannel = await client.channels.fetch(ledgerChannelId);
    const transactionHistoryMessage = await ledgerChannel.messages.fetch(transactionHistoryMessageId);

    // Add timestamp to the new transaction
    transactionToAdd = "<t:" + parseInt(Date.now() / 1000) + ":f> " + transactionToAdd;

    var transactions = transactionHistoryMessage.content.split("\n\n");
    transactions.pop();
    transactions.splice(1, 0, transactionToAdd);

    transactionHistoryMessage.edit(transactions.join("\n\n"));
}

async function trackInterestInTransactionHistory(userId, emote) {
    const ledgerChannel = await client.channels.fetch(ledgerChannelId);
    const transactionHistoryMessage = await ledgerChannel.messages.fetch(transactionHistoryMessageId);

    var transactions = transactionHistoryMessage.content.split("\n\n");

    for (let i = 1; i < transactions.length; i++) {
        if (transactions[i].search(userId + "> gained") < 0) { // Search for a message about this user gaining interest
            continue;
        }

        let thisTransactionText = transactions[i];

        // Update timestamp
        thisTransactionText = "<t:" + parseInt(Date.now() / 1000) + thisTransactionText.substring(thisTransactionText.search(":f>"));

        if (thisTransactionText.search(emote) < 0) {
            let emotePosition = thisTransactionText.search("<:");

            thisTransactionText = thisTransactionText.substring(0, emotePosition) + emote + ", " + thisTransactionText.substring(emotePosition);
        }

        let boffoPosition = thisTransactionText.search("₿");
        var interestAmount = parseInt(thisTransactionText.substring(boffoPosition).match(/\d/g).join("")) + 1;
        thisTransactionText = thisTransactionText.substring(0, boffoPosition + 1) + interestAmount + ".";

        for (let j = i; j > 1; j--) {
            transactions[j] = transactions[j - 1];
        }
        transactions[1] = thisTransactionText;

        transactionHistoryMessage.edit(transactions.join("\n\n"));
        return;
    }

    // If we make it here, there wasn't an interest message to update
    addToTransactionHistory("<@" + userId + "> gained interest from " + emote + ": ₿1.");
}

async function checkForEmotes(message) {
    const emotes = message.content.match(/<:.+?:\d+>/g);
    if (emotes == null) {
        return;
    }
    
    for (let i = 0; i < emotes.length; i++) {
        await giveEmoteOwnerRoyalties(emotes[i], message.member.id);
    }
}

// Helper function to easily fetch the general channel and send a message
async function sendToGeneralChannel(message) {
    const generalChannel = await client.channels.fetch(generalChannelId);
    await generalChannel.send(message);
}

client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isButton()) {
        const userId = interaction.member.id;
        const userDisplayName = interaction.member.displayName;
        
        if (interaction.component.customId === "addToWheelButton") {
            if (accountBalancesMap.get(userId) < 100) {
                sendToGeneralChannel(userDisplayName + " can't afford to add a movie to the wheel!");
                return;
            }

            const modal = new ModalBuilder()
            .setCustomId("addToWheelModal")
            .setTitle("Add a movie to the wheel");

            const movieTitleInput = new TextInputBuilder()
            .setCustomId("addToWheelMovieTitleTextInput")
            .setLabel("What movie will you add to the wheel?")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("Gooby");

            const row = new ActionRowBuilder().addComponents(movieTitleInput);

            modal.addComponents(row);

            // Show the modal
            await interaction.showModal(modal);

        } else if (interaction.component.customId === "yourChoiceNextButton") {
            if (accountBalancesMap.get(userId) < 200) {
                sendToGeneralChannel(userDisplayName + " can't afford to choose next week's movie!");
                return;
            }

            const modal = new ModalBuilder()
            .setCustomId("chooseNextMovieModal")
            .setTitle("Choose The Next Movie");

            const movieTitleInput = new TextInputBuilder()
            .setCustomId("chooseNextMovieTextInput")
            .setLabel("What movie will we watch next?")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("Gooby");

            const row = new ActionRowBuilder().addComponents(movieTitleInput);

            modal.addComponents(row);

            // Show the modal
            await interaction.showModal(modal);
            
        } else if (interaction.component.customId === "vetoButton") {
            if (accountBalancesMap.get(userId) < 300) {
                sendToGeneralChannel(userDisplayName + " failed to veto this week's movie because they're too broke! Embarrassing!!!");
                return;
            }


            const vetoConfirmButton = new ButtonBuilder()
            .setCustomId("vetoConfirmButton")
            .setLabel("Yes")
            .setStyle(ButtonStyle.Danger);

            const vetoConfirmWithShootButton = new ButtonBuilder()
            .setCustomId("vetoConfirmWithShootButton")
            .setLabel("Yes, and shoot @everyone")
            .setStyle(ButtonStyle.Danger);

            const vetoCancelButton = new ButtonBuilder()
            .setCustomId("vetoCancelButton")
            .setLabel("No")
            .setStyle(ButtonStyle.Secondary);

            const row = new ActionRowBuilder().addComponents(vetoConfirmButton, vetoConfirmWithShootButton, vetoCancelButton);

            const response = await interaction.reply({
                content: "<@" + userId + "> are you sure you want to veto this week's movie?",
                components: [row],
                ephemeral:true,
                fetchReply: true
            });

            try {
                const confirmation = await response.awaitMessageComponent({ filter: i => i.user.id === interaction.user.id, time: 60000 });

                if ((confirmation.customId === 'vetoConfirmButton' || confirmation.customId === 'vetoConfirmWithShootButton') && accountBalancesMap.get(userId) >= 300) {
                    addToBalanceForUserId(userId, -300);
                    await confirmation.update({ content: "Purchase successful! This message will auto delete <t:" + parseInt(Date.now() / 1000 + 10) + ":R>", components: [] }).then(confirmationMessage => {setTimeout(() => confirmationMessage.delete(), 9500)});

                    addToTransactionHistory("<@"+userId+"> paid ₿300 to veto this week's movie.");

                    await sendToGeneralChannel("<@" + userId + "> has paid ₿300 to veto this week's movie!");

                    if (confirmation.customId === 'vetoConfirmWithShootButton') {
                        const guild = await client.guilds.fetch(serverId);
                        var serverMembers = await guild.members.fetch();
                        // Filter out Ben, Gun and the user that vetoed
                        serverMembers = serverMembers.filter(member => member.id != benUserId && member.id != gunUserId && member.id != userId);
                        let serverMemberIds = serverMembers.map(member => member.id);

                        // Shoot everyone on the server
                        await sendToGeneralChannel("~shoot <@" + serverMemberIds.join("> <@") + ">");
                    }
                    
                } else if (confirmation.customId === 'vetoCancelButton') {
                    await confirmation.update({ content: 'Veto cancelled.', components: [] }).then(confirmationMessage => {setTimeout(() => confirmationMessage.delete(), 10000)});
                }
            } catch (e) {
                await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling.', components: [] }).then(setTimeout(() => interaction.deleteReply(), 10000));
            }
        }
    } else if (interaction.isModalSubmit()) {
        const userId = interaction.member.id;

        if (interaction.customId == "addToWheelModal") {
            const movieTitle = interaction.fields.getTextInputValue("addToWheelMovieTitleTextInput");

            addToBalanceForUserId(userId, -100);
            client.channels.fetch(suggestionsChannelId).then(channel => channel.send("<@"+userId+"> paid ₿100 to add " + movieTitle + " to the wheel!"));
            addToTransactionHistory("<@"+userId+"> paid ₿100 to add " + movieTitle + " to the wheel.");
            interaction.reply({content:"Purchase successful! This message will auto delete <t:" + parseInt(Date.now() / 1000 + 10) + ":R>", ephemeral:true}).then(confirmationMessage => {setTimeout(() => confirmationMessage.delete(), 9500)});
        } else if (interaction.customId == "chooseNextMovieModal") {
            const movieTitle = interaction.fields.getTextInputValue("chooseNextMovieTextInput");

            addToBalanceForUserId(userId, -200);
            client.channels.fetch(suggestionsChannelId).then(channel => channel.send("<@"+userId+"> paid ₿200 for us to watch " + movieTitle + " next movie night!"));
            addToTransactionHistory("<@"+userId+"> paid ₿200 for us to watch " + movieTitle + " next movie night.");
            interaction.reply({content:"Purchase successful! This message will auto delete <t:" + parseInt(Date.now() / 1000 + 10) + ":R>", ephemeral:true}).then(confirmationMessage => {setTimeout(() => confirmationMessage.delete(), 9500)});
        }
    } else if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        //
        // Boffo commands
        //
        if (interaction.commandName == "tip") {
            let fromUser = interaction.member;
            let toUser = interaction.options.getUser("recipient");
            let amount = interaction.options.getInteger("amount");
            tip(fromUser, toUser, amount, interaction)
            return;

        } else if (interaction.commandName == "bid") {
            let biddingUser = interaction.member;
            var emoteToBuy = interaction.options.getString("emote");
            emoteToBuy = emoteToBuy.substring(emoteToBuy.search("<"),emoteToBuy.search(">") + 1);
            let bidAmount = interaction.options.getInteger("amount");
            bid(biddingUser, emoteToBuy, bidAmount, interaction);
            return;

        } else if (interaction.commandName == "bonus") {
            let fromUser = interaction.member;
            let toUser = [interaction.guild.members.cache.get(interaction.options.getUser("recipient").id)];
            let amount = interaction.options.getInteger("amount");
            bonus(fromUser, toUser, amount, interaction)
            return;

        //
        // Gun commands
        //
        } else if (interaction.commandName == "shoot") {
            let target = [interaction.guild.members.cache.get(interaction.options.getUser("target").id)]
            shoot(target, interaction.member, interaction, 15 * 1000)
            return;

        } else if (interaction.commandName == "kill") {
            let target = [interaction.guild.members.cache.get(interaction.options.getUser("target").id)]
            shoot(target, interaction.member, interaction, 60 * 1000)
            return;

        //
        // Scoreboard updates
        //
        } else if (interaction.commandName == "add") {
            if (interaction.channelId != scoreboardChannelId) {
                interaction.reply({content:"This command can only be used in the scoreboard channel.", ephemeral:true})
                return;
            } 
            let fromUserId = interaction.member.id;
            let movieTitle = interaction.options.getString("movie");
            let rank = interaction.options.getInteger("rank");
            addMovieToScoreboard(rank, movieTitle, fromUserId, interaction);
            return;

        } else if (interaction.commandName == "remove") {
            if (interaction.channelId != scoreboardChannelId) {
                interaction.reply({content:"This command can only be used in the scoreboard channel.", ephemeral:true})
                return;
            } 
            let rank = interaction.options.getInteger("rank");
            removeMovieFromScoreboard(rank, interaction);
            return;

        } else if (interaction.commandName == "update") {
            if (interaction.channelId != scoreboardChannelId) {
                interaction.reply({content:"This command can only be used in the scoreboard channel.", ephemeral:true})
                return;
            } 
            let currentRank = interaction.options.getInteger("currentrank");
            let newRank = interaction.options.getInteger("newrank");
            let newTitle = interaction.options.getString("newtitle");
            updateMovieRankOnScoreboard(currentRank, newRank, newTitle, interaction);
            return;
        }
    }
});

client.on('messageCreate', async (msg) => {
    if (msg.content.charAt(0) != '~' &&
        (msg.author.id != gunUserId || msg.content.search("acquires") < 0)) {
        await checkForEmotes(msg);
        return;
    }

    if (msg.content.startsWith("~delete")) {
        if (msg.author.id != geneUserId && msg.author.id != benUserId) {
            return;
        }
        if (msg.reference) {
            msg.channel.messages.fetch(msg.reference.messageId).then( message => message.delete());
        }
        msg.delete();
        return;
    }

    if (msg.content.startsWith("~bid")) {
        const biddingUser = msg.member;
        const emoteToBuy = msg.content.substring(msg.content.search("<"), msg.content.search(">") + 1);
        var bidAmount = msg.content.split(" ");
        bidAmount = parseInt(bidAmount[bidAmount.length - 1].match(/\d/g).join(""));
        if (isNaN(bidAmount)) {
            msg.reply("Invalid amount! " + randomFaceEmote());
            return;
        }

        bid(biddingUser, emoteToBuy, bidAmount, msg);
        return;
    }

    if (msg.mentions.members.size > 0) {
        if (msg.content.substring(1, 6).toLowerCase() === "shoot") {
            msg.channel.sendTyping();
            shootFromMessage(msg, 15 * 1000);
        } else if (msg.content.substring(1, 5).toLowerCase() === "kill") {
            msg.channel.sendTyping();
            shootFromMessage(msg, 60 * 1000);
        }

        if (msg.content.startsWith("~tip")) {
            msg.channel.sendTyping();
            const fromUser = msg.member;

            var amountToSend = msg.content.split(" ");
            amountToSend = parseInt(amountToSend[amountToSend.length - 1].match(/\d/g).join(""));

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
            var amountToSend = msg.content.split(" ");
            amountToSend = parseInt(amountToSend[amountToSend.length - 1].match(/\d/g).join(""));
            bonus(msg.author.id, Array.from(msg.mentions.members.values()), amountToSend, msg)
            return;
        }
    }
    
    if (msg.channel.id === scoreboardChannelId) {
        var separatorPos = msg.content.search(" "); // The first space after the bot command
        if (separatorPos < 0) {
            return;
        }
        const movieEntry = msg.content.substring(separatorPos + 1); // The sent message with the bot command excluded

        if (msg.content.toLowerCase().startsWith("~add")) {
            separatorPos = movieEntry.search(" ");
            if (separatorPos < 0) {
                return;
            }

            const newMovieNumber = movieEntry.substring(0, separatorPos).match(/\d/g).join("");
            const newMovieTitle = movieEntry.substring(separatorPos + 1);

            await addMovieToScoreboard(newMovieNumber, newMovieTitle, msg.author.id, msg);
            msg.delete();
            return;

        } else if (msg.content.toLowerCase().startsWith("~remove")) {
            const movieNumber = movieEntry.match(/\d/g).join("");
            await removeMovieFromScoreboard(movieNumber, msg);
            msg.delete();
            return;
            
        } else if (msg.content.toLowerCase().startsWith("~update")) {
            separatorPos = movieEntry.search(" ");
            if (separatorPos < 0) {
                return;
            }
            const movieNumber = movieEntry.substring(0, separatorPos).match(/\d/g).join("");
            const newMovieTitle = movieEntry.substring(separatorPos + 1);

            await updateMovieTitleOnScoreboard(movieNumber, newMovieTitle, msg);
            msg.delete();
            return;

        } else {
            return;
        }
    }
});

async function addMovieToScoreboard(newMovieNumber, newMovieTitle, userId, msg) {
    msg.channel.sendTyping();
    var movieCollection = await getMovieCollection(msg.channel);
    if (movieCollection.length <= 50) {
        msg.reply("Error parsing the movie collection, canceling change.").then(errorMessage => {
            setTimeout(() => errorMessage.delete(), 10000)
        });
        return;
    }

    movieCollection.splice(newMovieNumber - 1, 0, newMovieNumber + ". " + newMovieTitle);
    for (let i = newMovieNumber; i < movieCollection.length; i++) {
        let separatorPos = movieCollection[i].indexOf(".");
        
        movieCollection[i] = (+i + +1) + movieCollection[i].substring(separatorPos);
    }

    // If Ben has added something to the scoreboard, everyone in voice gets their Boffo allowance
    var membersList = "";
    if (userId == benUserId) {
        membersList = await grantAllowance();
    }
    var confirmationText = "";
    if (membersList != "") {
        confirmationText = "Added " + newMovieTitle + " at rank " + newMovieNumber + ", and allowance granted to " + membersList + ".";
    } else {
        confirmationText = "Added " + newMovieTitle + " at rank " + newMovieNumber + ".";
    }

    await applyUpdatesToScoreboard(movieCollection, confirmationText, msg);
}

async function removeMovieFromScoreboard(movieNumber, msg) {
    msg.channel.sendTyping();
    var movieCollection = await getMovieCollection(msg.channel);
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

async function updateMovieTitleOnScoreboard(movieNumber, newMovieTitle, msg) {
    msg.channel.sendTyping();
    var movieCollection = await getMovieCollection(msg.channel);
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

async function updateMovieRankOnScoreboard(oldRank, newRank, newMovieTitle, msg) {
    if (!newRank && !newMovieTitle) {
        msg.reply("Please supply an updated title / rank.").then(errorMessage => {
            setTimeout(() => errorMessage.delete(), 10000)
        });
        return;
    }
    msg.channel.sendTyping();
    var movieCollection = await getMovieCollection(msg.channel);
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

async function applyUpdatesToScoreboard(newMovieCollection, confirmationText, msg) {
    let archiveChannel = await client.channels.fetch(scoreboardArchiveChannelId);

    // Every 5 updates, dump the entire scoreboard into the archive
    var scoreboardNeedsArchive = true
    const messages = await archiveChannel.messages.fetch({ limit: 5 }); // Check last 5 messages
    for( let message of messages ) {
        let content = message[1].content
        if (content.indexOf("Scoreboard updated: ") < 0) {
            scoreboardNeedsArchive = false;
            break;
        }
    }

    await archiveChannel.send("Scoreboard updated: " + confirmationText);
    await updateScoreBoard(newMovieCollection, msg.channel, scoreboardNeedsArchive, archiveChannel);
    await msg.reply(confirmationText).then(confirmationMessage => {
        setTimeout(() => confirmationMessage.delete(), 10000)
    });
}

client.on('voiceStateUpdate', async (oldState, newState) => {
    if (newState.streaming && newState.channel != null && !oldState.streaming) {
        const currentTimestamp = Date.now();
        const generalChannel = await client.channels.fetch(generalChannelId);
        const messages = await generalChannel.messages.fetch({ limit: 15 }); // Check last 15 messages

        for( let message of messages ) {
            if (currentTimestamp - message[1].createdTimestamp > 4 * 60 * 60 * 1000) { // Check last four hours
                break;
            }
            if (message[1].author.id === gunUserId && message[1].content.startsWith(newState.member.displayName)) {
                return;
            }
        }
        generalChannel.send(newState.member.displayName + " has gone live!");
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
        const generalChannel = await client.channels.fetch(generalChannelId);
        generalChannel.send("<@" + emoteProperties.owner + "> lost ₿" + emoteProperties.value + " from the removal of :" + emoteName + ":!");
        
        emoteOwnershipMap.delete(emoteFullName);
        updateEmoteOwnershipMessage();
    }
});

async function grantAllowance() {
    let voiceChannel = await client.channels.fetch(voiceChannelId);
    let membersArray = Array.from(voiceChannel.members.values());
    var membersList = "";
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
    if (reaction.message.author.id != user.id && reaction.emoji.id){
        giveEmoteOwnerRoyalties("<:" + reaction.emoji.name + ":" + reaction.emoji.id + ">", user.id);
    }
});

async function giveEmoteOwnerRoyalties(emoteId, userId) {
    if (!emoteOwnershipMap.has(emoteId)) {
        return;
    }

    const emoteOwner = emoteOwnershipMap.get(emoteId).owner;
    if (emoteOwner == userId) {
        return;
    } else {
        addToBalanceForUserId(emoteOwner, 1);
        trackInterestInTransactionHistory(emoteOwner, emoteId);
    }
}

function shootFromMessage(msg, timeoutDuration) {
    shoot(msg.mentions.members, msg.member, msg, timeoutDuration)
}

function shoot(targets, shooter, msg, timeoutDuration) {
    var backfire = false;
    var shootMessage = randomFaceEmote();
    var tagMessage = "";

    targets.forEach( mentionedMember => {
        if (mentionedMember.id == benUserId || mentionedMember.id == gunUserId) {
          if (shooter.id == benUserId || shooter.id == gunUserId) {
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
    msg.reply(tagMessage);
    msg.channel.send(shootMessage);
}

async function updateScoreBoard(movieCollection, channel, needsArchive, archiveChannel) {
    var scoreboardMessageIndex = 0;
    var scoreboardMessageContent = "";
    var scoreboardMessageCharCount = 0;

    for (let i = 0; i < movieCollection.length; i++) {
        if (scoreboardMessageCharCount + movieCollection[i].length + 1 > 2000) {
            await channel.messages.fetch(scoreboardMessageIds[scoreboardMessageIndex]).then( message => {
                if (needsArchive) { archiveChannel.send(message.content); }
                message.edit(content=scoreboardMessageContent);
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
        message.edit(content=scoreboardMessageContent);
    });
}

function randomFaceEmote() {
    const faceEmotes = client.emojis.cache.filter((emoji) => !nonFaceEmotes.includes(emoji.id)).map(filteredEmoji => "<:" + filteredEmoji.name + ":" + filteredEmoji.id + ">");
    
    let min = Math.ceil(0);
    let max = Math.floor(faceEmotes.length);
    let index = Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
    return faceEmotes[index];
}

function tip(fromUser, toUser, amountToSend, msg) {
    var fromUserBalance = accountBalancesMap.get(fromUser.id);
    var toUserBalance = accountBalancesMap.get(toUser.id);
                
    if (amountToSend > fromUserBalance) {
        msg.reply("You only have ₿" + fromUserBalance + "! " + randomFaceEmote());
        return;
    } else if (fromUser.id == toUser.id) {
        msg.channel.send("~shoot <@" + fromUser.id + ">");
        return;
    }

    fromUserBalance -= amountToSend;
    toUserBalance += amountToSend;

    updateBalanceForUserId(fromUser.id, fromUserBalance);
    updateBalanceForUserId(toUser.id, toUserBalance);
    msg.reply(fromUser.displayName + " sends <@" + toUser.id + "> ₿" + amountToSend + ".\n" + fromUser.displayName + "'s balance: ₿" + fromUserBalance + "\n" + toUser.displayName + "'s balance: ₿" + toUserBalance);
    addToTransactionHistory(fromUser.displayName + " sent " + toUser.displayName + " ₿" + amountToSend.toLocaleString("en-US") + ".");
}

function bonus(fromUserId, toUsers, amountToSend, msg) {
    if (fromUserId != geneUserId && fromUserId != benUserId) {
        msg.reply("~shoot <@" + fromUserId + ">");
        return;
    }

    if (isNaN(amountToSend)) {
        msg.reply("Invalid amount! " + randomFaceEmote());
        return;
    }

    for (let i = 0; i < toUsers.length; i++) {
        const toUser = toUsers[i];

        addToBalanceForUserId(toUser.id, amountToSend);
        msg.reply("Added ₿" + amountToSend.toLocaleString("en-US") + " to " + toUser.displayName + "'s balance.\nNew current balance: ₿" + accountBalancesMap.get(toUser.id).toLocaleString("en-US") + ".");
    }
}

function bid(biddingUser, emoteToBuy, bidAmount, msg) {
    if (emoteToBuy == "") {
        return;
    } else if (emoteToBuy == gunEmote || emoteToBuy == gunEmote2) {
        if (biddingUser.id != benUserId) {
            msg.reply("~shoot");
        }
        return;
    }
    var emoteId = emoteToBuy.substring(3);
    emoteId = emoteId.substring(emoteId.search(":") + 1, emoteId.search(">"));

    var serverEmote = client.emojis.cache.find(emoji => emoji.id == emoteId);
    if (serverEmote == null || !serverEmote.available) {
        if (biddingUser.id != benUserId) {
            msg.reply("~shoot");
        }
        return;
    }
    msg.channel.sendTyping();
    // verify user has enough ₿ to bid on emote
    var biddingUserBalance = accountBalancesMap.get(biddingUser.id);

    if (bidAmount > biddingUserBalance) {
        msg.reply("Insufficient funds! " + randomFaceEmote());
        return;
    }

    // find current ownership
    var previousOwner;
    if (emoteOwnershipMap.has(emoteToBuy)) {
        const currentEmoteProperties = emoteOwnershipMap.get(emoteToBuy);

        if (currentEmoteProperties.owner == biddingUser.id) {
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

    emoteOwnershipMap.set(emoteToBuy, new Emote(emoteToBuy, biddingUser.id, bidAmount));

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
