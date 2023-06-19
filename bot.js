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
    ["206975381067137025", "1072279186032558110"], // Dylan
    ["701085890117632075", "1072279198665814056"], // Garrett
    ["282597947064057856", "1072279211437465640"], // Gene
    ["281984105523183616", "1072279223840022568"], // Nathaniel
    ["746882782596431872", "1072279236355833917"], // Maren
    ["206968933725503488", "1072279248938746017"], // Joe
    ["209463935009685506", "1072279261584576584"] // Ted
]);

function Emote(id, owner, value) {
    this.id = id;
    this.owner = owner;
    this.value = value;
}

var emoteOwnershipMap = new Map();
var accountBalancesMap = new Map();

client.login(process.env.token);

async function initializeMessages() { // Used for initializing or editing any template messages on startup
    const ledgerChannel = await client.channels.fetch(ledgerChannelId);
    // const messag = await ledgerChannel.messages.fetch("1072279123185127534");

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

client.on('ready', () => {
    // initializeMessages();
    initializeAccountBalances();
    initializeEmoteOwnership();
    console.log(`Logged in as ${client.user.tag}!`);
});

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
    addToTransactionHistory("<t:" + parseInt(Date.now() / 1000) + ":f> <@" + userId + "> gained interest from " + emote + ": ₿1.");
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

client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isButton()) {
        const userId = interaction.member.id;
        const userDisplayName = interaction.member.displayName;
        
        if (interaction.component.customId === "addToWheelButton") {
            if (accountBalancesMap.get(userId) < 100) {
                interaction.reply(userDisplayName + " can't afford to add a movie to the wheel!").then(errorMsg => {setTimeout(() => errorMsg.delete(), 10000)});
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
                interaction.reply(userDisplayName + " can't afford to choose next week's movie!").then(errorMsg => {setTimeout(() => errorMsg.delete(), 10000)});
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
                interaction.reply(userDisplayName + " failed to veto this week's movie because they're too broke! Embarrassing!!!").then(errorMsg => {setTimeout(() => errorMsg.delete(), 10000)});
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

            const row = new ActionRowBuilder().addComponents(vetoConfirmButton, vetoCancelButton);

            const response = await interaction.reply({
                content: "<@" + userId + "> are you sure you want to veto this week's movie?",
                components: [row],
                ephemeral:true
            });

            try {
                const confirmation = await response.awaitMessageComponent({ filter: i => i.user.id === interaction.user.id, time: 60000 });

                if (confirmation.customId === 'vetoConfirmButton' && accountBalancesMap.get(userId) >= 300) {
                    addToBalanceForUserId(userId, -300);
                    await confirmation.update({ content: "Purchase successful! This message will auto delete <t:" + parseInt(Date.now() / 1000 + 10) + ":R>", components: [] }).then(confirmationMessage => {setTimeout(() => confirmationMessage.delete(), 9500)});

                    addToTransactionHistory("<t:" + parseInt(Date.now() / 1000) + ":f> <@"+userId+"> paid added ₿300 to veto this week's movie.");

                    const generalChannel = await client.channels.fetch(generalChannelId);
                    await generalChannel.send("<@" + userId + "> has paid ₿300 to veto this week's movie!");

                    const guild = await client.guilds.fetch(serverId);
                    var serverMembers = await guild.members.fetch();
                    // Filter out Ben, Gun and the user that vetoed
                    serverMembers = serverMembers.filter(member => member.id != benUserId && member.id != gunUserId && member.id != userId);
                    let serverMemberIds = serverMembers.map(member => member.id);

                    // Shoot everyone on the server
                    await generalChannel.send("~shoot <@" + serverMemberIds.join("> <@") + ">");
                    
                } else if (confirmation.customId === 'vetoCancelButton') {
                    await confirmation.update({ content: 'Veto cancelled.', components: [] }).then(confirmationMessage => {setTimeout(() => confirmationMessage.delete(), 10000)});
                }
            } catch (e) {
                await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling.', components: [] }).then(confirmationMessage => {setTimeout(() => confirmationMessage.delete(), 10000)});
            }
        }
    } else if (interaction.isModalSubmit()) {
        const userId = interaction.member.id;

        if (interaction.customId == "addToWheelModal") {
            const movieTitle = interaction.fields.getTextInputValue("addToWheelMovieTitleTextInput");

            addToBalanceForUserId(userId, -100);
            client.channels.fetch(suggestionsChannelId).then(channel => channel.send("<@"+userId+"> paid ₿100 to add " + movieTitle + " to the wheel!"));
            addToTransactionHistory("<t:" + parseInt(Date.now() / 1000) + ":f> <@"+userId+"> paid ₿100 to add " + movieTitle + " to the wheel.");
            interaction.reply({content:"Purchase successful! This message will auto delete <t:" + parseInt(Date.now() / 1000 + 10) + ":R>", ephemeral:true}).then(confirmationMessage => {setTimeout(() => confirmationMessage.delete(), 9500)});
        } else if (interaction.customId == "chooseNextMovieModal") {
            const movieTitle = interaction.fields.getTextInputValue("chooseNextMovieTextInput");

            addToBalanceForUserId(userId, -200);
            client.channels.fetch(suggestionsChannelId).then(channel => channel.send("<@"+userId+"> paid ₿200 for us to watch " + movieTitle + " next movie night!"));
            addToTransactionHistory("<t:" + parseInt(Date.now() / 1000) + ":f> <@"+userId+"> paid ₿200 for us to watch " + movieTitle + " next movie night.");
            interaction.reply({content:"Purchase successful! This message will auto delete <t:" + parseInt(Date.now() / 1000 + 10) + ":R>", ephemeral:true}).then(confirmationMessage => {setTimeout(() => confirmationMessage.delete(), 9500)});
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
        const emoteToBuy = msg.content.substring(msg.content.search("<"), msg.content.search(">") + 1);
        if (emoteToBuy == "") {
            return;
        } else if (emoteToBuy == gunEmote || emoteToBuy == gunEmote2) {
            if (msg.author.id != benUserId) {
                msg.channel.send("~shoot <@" + msg.author.id + ">");
            }
            return;
        }
        var emoteId = emoteToBuy.substring(3);
        emoteId = emoteId.substring(emoteId.search(":") + 1, emoteId.search(">"));

        var serverEmote = client.emojis.cache.find(emoji => emoji.id == emoteId);
        if (serverEmote == null || !serverEmote.available) {
            if (msg.author.id != benUserId) {
                msg.channel.send("~shoot <@" + msg.author.id + ">");
            }
            return;
        }
        msg.channel.sendTyping();
        // verify user has enough ₿ to bid on emote
        const biddingUser = msg.member.id;
        var biddingUserBalance = accountBalancesMap.get(biddingUser);

        var bidAmount = msg.content.split(" ");
        bidAmount = parseInt(bidAmount[bidAmount.length - 1].match(/\d/g).join(""));
        if (isNaN(bidAmount)) {
            msg.channel.send("Invalid amount! " + randomFaceEmote());
            return;
        } else if (bidAmount > biddingUserBalance) {
            msg.channel.send("Insufficient funds! " + randomFaceEmote());
            return;
        }

        // find current ownership
        var previousOwner;
        if (emoteOwnershipMap.has(emoteToBuy)) {
            const currentEmoteProperties = emoteOwnershipMap.get(emoteToBuy);

            if (currentEmoteProperties.owner == biddingUser) {
                return;
            }
            // Make sure new user can afford
            if (currentEmoteProperties.value >= bidAmount) {
                msg.channel.send("Bid amount must be higher than ₿" + currentEmoteProperties.value + "! " + randomFaceEmote());
                return;
            }

            previousOwner = currentEmoteProperties.owner;
            addToBalanceForUserId(previousOwner, currentEmoteProperties.value);
        }

        emoteOwnershipMap.set(emoteToBuy, new Emote(emoteToBuy, biddingUser, bidAmount));

        // update the ownership message
        updateEmoteOwnershipMessage();

        // charge bidder
        addToBalanceForUserId(biddingUser, -bidAmount);
        // refund old owner
        if (previousOwner != null) {
            msg.channel.send(msg.member.displayName + " acquires " + emoteToBuy + " from <@" + previousOwner + "> for ₿" + bidAmount + "!");
            addToTransactionHistory("<t:" + parseInt(Date.now() / 1000) + ":f> " + msg.member.displayName + " acquired " + emoteToBuy + " from <@" + previousOwner + "> for ₿" + bidAmount + ".");
        } else {
            msg.channel.send(msg.member.displayName + " acquires " + emoteToBuy + " for ₿" + bidAmount + "!");
            addToTransactionHistory("<t:" + parseInt(Date.now() / 1000) + ":f> " + msg.member.displayName + " acquired " + emoteToBuy + " for ₿" + bidAmount + ".");
        }
    }

    if (msg.mentions.members.size > 0) {
        if (msg.content.substring(1, 6).toLowerCase() === "shoot") {
            msg.channel.sendTyping();
            shoot(msg, 15 * 1000);
        } else if (msg.content.substring(1, 5).toLowerCase() === "kill") {
            msg.channel.sendTyping();
            shoot(msg, 60 * 1000);
        }

        if (msg.content.startsWith("~tip")) {
            msg.channel.sendTyping();
            const fromUser = msg.member.id;
            var fromUserBalance = accountBalancesMap.get(fromUser);

            const mentionedUserIds = Array.from( msg.mentions.members.keys() );
            var amountToSend = msg.content.split(" ");
            amountToSend = parseInt(amountToSend[amountToSend.length - 1].match(/\d/g).join(""));

            if (isNaN(amountToSend)) {
                msg.channel.send("Invalid amount! " + randomFaceEmote());
                return;
            }

            for (let i = 0; i < mentionedUserIds.length; i++) {
                const toUser = mentionedUserIds[i];
                var toUserBalance = accountBalancesMap.get(toUser);
                
                if (amountToSend > fromUserBalance) {
                    msg.reply("You only have ₿" + fromUserBalance + "! " + randomFaceEmote());
                    return;
                } else if (fromUser == toUser) {
                    msg.channel.send("~shoot <@" + fromUser + ">");
                    return;
                }

                fromUserBalance -= amountToSend;
                toUserBalance += amountToSend;

                updateBalanceForUserId(fromUser, fromUserBalance);
                updateBalanceForUserId(toUser, toUserBalance);
                msg.channel.send(msg.member.displayName + " sends " + msg.mentions.members.get(toUser).displayName + " ₿" + amountToSend + ".\n" + msg.member.displayName + "'s balance: ₿" + fromUserBalance + "\n" + msg.mentions.members.get(toUser).displayName + "'s balance: ₿" + toUserBalance);
                addToTransactionHistory("<t:" + parseInt(Date.now() / 1000) + ":f> " + msg.member.displayName + " sent " + msg.mentions.members.get(toUser).displayName + " ₿" + amountToSend.toLocaleString("en-US") + ".");
            }
            return;
        }

        if (msg.content.startsWith("~bonus")) {
            if (msg.author.id != geneUserId && msg.author.id != benUserId) {
                msg.channel.send("~shoot <@" + msg.author.id + ">");
                return;
            }
            const mentionedUserIds = Array.from( msg.mentions.members.keys() );
            var amountToSend = msg.content.split(" ");
            amountToSend = parseInt(amountToSend[amountToSend.length - 1].match(/\d/g).join(""));
    
            if (isNaN(amountToSend)) {
                msg.channel.send("Invalid amount! " + randomFaceEmote());
                return;
            }
    
            for (let i = 0; i < mentionedUserIds.length; i++) {
                const toUser = mentionedUserIds[i];
    
                addToBalanceForUserId(toUser, amountToSend);
                msg.channel.send("Added ₿" + amountToSend.toLocaleString("en-US") + " to " + msg.mentions.members.get(toUser).displayName + "'s balance.\nNew current balance: ₿" + accountBalancesMap.get(toUser).toLocaleString("en-US") + ".");
            }
            return;
        }
    }
    
    if (msg.channel.id === scoreboardChannelId) {
        var collection = await getMovieCollection(msg.channel);
        var separatorPos = msg.content.search(" "); // The first space after the bot command
        if (separatorPos < 0) {
            return;
        }
        const movieEntry = msg.content.substring(separatorPos + 1); // The sent message with the bot command excluded
        var confirmationText = "";

        if (msg.content.toLowerCase().startsWith("~add")) {
            separatorPos = movieEntry.search(" ");
            if (separatorPos < 0) {
                return;
            }
            msg.channel.sendTyping();

            const newMovieNumber = movieEntry.substring(0, separatorPos).match(/\d/g).join("");
            const newMovieTitle = movieEntry.substring(separatorPos + 1);

            collection.splice(newMovieNumber - 1, 0, newMovieNumber + ". " + newMovieTitle);
            for (let i = newMovieNumber; i < collection.length; i++) {
                separatorPos = collection[i].indexOf(".");
                
                collection[i] = (+i + +1) + collection[i].substring(separatorPos);
            }

            // If Ben has added something to the scoreboard, everyone in voice gets their Boffo allowance
            var membersList = "";
            if (msg.author.id == benUserId) {
                membersList = await grantAllowance();
            }
            if (membersList != "") {
                confirmationText = "Added " + newMovieTitle + " at rank " + newMovieNumber + ", and allowance granted to " + membersList + ".";
            } else {
                confirmationText = "Added " + newMovieTitle + " at rank " + newMovieNumber + ".";
            }

        } else if (msg.content.toLowerCase().startsWith("~remove")) {
            msg.channel.sendTyping();
            const newMovieNumber = movieEntry.match(/\d/g).join("");
            let oldMovieName = collection[newMovieNumber - 1];
            collection.splice(newMovieNumber - 1, 1);
            for (let i = newMovieNumber - 1; i < collection.length; i++) {
                separatorPos = collection[i].indexOf(".");
                
                collection[i] = (+i + +1) + collection[i].substring(separatorPos);
            }

            confirmationText = "Removed rank #" + oldMovieName + ".";
            
        } else if (msg.content.toLowerCase().startsWith("~update")) {
            separatorPos = movieEntry.search(" ");
            if (separatorPos < 0) {
                return;
            }
            msg.channel.sendTyping();

            const newMovieNumber = movieEntry.substring(0, separatorPos).match(/\d/g).join("");
            const newMovieTitle = movieEntry.substring(separatorPos + 1);
            const oldMovieTitle = collection[newMovieNumber - 1];

            collection[newMovieNumber - 1] = newMovieNumber + ". " + newMovieTitle;

            confirmationText = "Updated rank #" + oldMovieTitle + " to " + newMovieTitle + ".";
        } else {
            return;
        }

        updateScoreBoard(collection, msg.channel);
        msg.delete();
        msg.channel.send(confirmationText).then(confirmationMessage => {
            setTimeout(() => confirmationMessage.delete(), 10000)
        });
    }
});

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
    // If an emoji being deleted is owned, refund the owner
    if (emoteOwnershipMap.has(emoteFullName)) {
        const emoteProperties = emoteOwnershipMap.get(emoteFullName);

        addToBalanceForUserId(emoteProperties.owner, emoteProperties.value);

        addToTransactionHistory("<t:" + parseInt(Date.now() / 1000) + ":f> <@" + emoteProperties.owner + "> was refunded ₿" + emoteProperties.value + " for " + emoteName);

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
        addToTransactionHistory("<t:" + parseInt(Date.now() / 1000) + ":f> " + membersList + " got their ₿10 allowance.");
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

function shoot(msg, timeoutDuration) {

    var backfire = false;
    var shootMessage = randomFaceEmote();
    var tagMessage = "";

    msg.mentions.members.forEach( mentionedMember => {
        if (mentionedMember.id == benUserId || mentionedMember.id == gunUserId) {
          if (msg.member.id == benUserId || msg.member.id == gunUserId) {
                return;
            } else {
                msg.member.timeout(timeoutDuration * 2);
                tagMessage = "<@" + msg.member.id + ">";
                backfire = true;
            }
        } else {
            if (tagMessage != "") {
                tagMessage += " ";
            }
            tagMessage += "<@" + mentionedMember.id + ">";
            mentionedMember.timeout(timeoutDuration);
        }
    });
    for (let i = 0; i < msg.mentions.members.size; i++) {
        shootMessage = gunEmote + shootMessage;

        if (backfire || timeoutDuration > 20 * 1000) {
            shootMessage = shootMessage + gunEmote2;
        }
    }
    msg.channel.send(tagMessage);
    msg.channel.send(shootMessage);
}

async function updateScoreBoard(movieCollection, channel) {
    var scoreboardMessageIndex = 0;
    var scoreboardMessageContent = "";
    var scoreboardMessageCharCount = 0;

    for (let i = 0; i < movieCollection.length; i++) {
        if (scoreboardMessageCharCount + movieCollection[i].length + 1 > 2000) {
            await channel.messages.fetch(scoreboardMessageIds[scoreboardMessageIndex]).then( message => message.edit(content=scoreboardMessageContent));

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

    channel.messages.fetch(scoreboardMessageIds[scoreboardMessageIndex]).then( message => message.edit(content=scoreboardMessageContent));
}

function randomFaceEmote() {
    const faceEmotes = client.emojis.cache.filter((emoji) => !nonFaceEmotes.includes(emoji.id)).map(filteredEmoji => "<:" + filteredEmoji.name + ":" + filteredEmoji.id + ">");
    
    let min = Math.ceil(0);
    let max = Math.floor(faceEmotes.length);
    let index = Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
    return faceEmotes[index];
}
