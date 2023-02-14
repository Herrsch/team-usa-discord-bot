import {
    GUN_EMOTE,
    GUN_EMOTE_2,
    FACE_EMOTES,
    GUN_USER_ID,
    BEN_USER_ID,
    LEDGER_CHANNEL_ID,
    EMOTE_OWNERSHIP_MESSAGE_ID,
    TRANSACTION_HISTORY_MESSAGE_ID,
    SCOREBOARD_MESSAGE_IDS,
    BOFFO_BALANCE_IDS_MAP
} from "constants";

const Discord = require('discord.js');
const client = new Discord.Client({
    intents: ["GUILDS", "GUILD_MEMBERS", "GUILD_MESSAGES", "GUILD_VOICE_STATES", "GUILD_MESSAGE_REACTIONS"]
});
require('dotenv').config();
// const wait = require('util').promisify(setTimeout); // can use this to wait(1000) if need

client.on('ready', () => {
    // initializeMessages();
    console.log('Logged in!');
});

/*
async function initializeMessages() { // Used for initializing or editing any template messages on startup
    const ledgerChannel = await client.channels.fetch(LEDGER_CHANNEL_ID);
    // const transactionHistoryMessage = await ledgerChannel.messages.fetch(TRANSACTION_HISTORY_MESSAGE_ID);
    // transactionHistoryMessage.edit("Transaction history:\n\nnone\n\nnone\n\nnone\n\nnone\n\nnone");

//     const emoteOwnershipMessage = await ledgerChannel.messages.fetch(EMOTE_OWNERSHIP_MESSAGE_ID);
//     emoteOwnershipMessage.edit("Unowned emotes: <:thomasiamcompletelyspeechless:847300197548556318> (₿1) | <:howembarrassing:815755068375826545> (₿1)\
//  | <:announcement:847274686135664640> (₿1) | <:myqueen:804950697883205633> (₿1) | <:dunkaccino:790367046868140053> (₿1) | <:momwasrightaboutyou:919799591669497927> (₿1) | \
//  <:lola:794015396121280522> (₿1) | <:nathanielbait:852338398273470505> (₿1) | <:bust:954607891476807740> (₿1) | <:yousureaboutthat:810692238472249345> (₿1) | <:gooby:791486603595874366> (₿1) | \
//  <:ploggers:816871218837323786> (₿1) | <:pleasestop:897146206105530378> (₿1) | <:lazarwolf:955293614907465738> (₿1) | <:stung:967970671797887016> (₿1) | <:preach:890421423468871720> (₿1) | \
//  <:escape:872580606339469404> (₿1) | <:Jeb:788583309075939381> (₿1) | <:fast:788527751610892308> (₿1) | <:dontmakemekillyou:837140610212823050> (₿1) | <:nuntooshabby:808199411053756426>\
//  (₿1) | <:yikes:810686117891932170> (₿1) | <:squattersrights:869787818287841300> (₿1) | <:poggers:810693855933759518> (₿1) | <:codepurple:906366020153913454> (₿1) | <:chromebook:788964896309903370>\
//  (₿1) | <:trapped:805608831535153221> (₿1) | <:uhoh:795491005406380034> (₿1) | <:goodboy:1071996889312014386> (₿1) | <:ted:788578667072716811> (₿1)\
//  | <:illhave:985732884679774208> (₿1) | <:theman:985732908528574475> (₿1) | <:sizedmeat:985732897094914168> (₿1) | <:balls:985732868397498408> (₿1)");

    // const commandsMessage = await ledgerChannel.messages.fetch("1072279135709311046");
    // commandsMessage.edit("Commands:\n`~tip @user #`\n`~bid :emotename: #`");
}
*/

async function getMovieCollection(channel) {
    const message = await channel.messages.fetch(SCOREBOARD_MESSAGE_IDS[0]);
    var movieCollection = message.content.split("\n");

    for (let i = 1; i < SCOREBOARD_MESSAGE_IDS.length; i++) {
        const message2 = await channel.messages.fetch(SCOREBOARD_MESSAGE_IDS[i]);
        if (!message2.content.startsWith("List Part ")) {
            movieCollection = [...movieCollection, ...message2.content.split("\n")];
        }
    }

    return movieCollection;
}

async function getBalanceForUserId(userId) {
    if (!BOFFO_BALANCE_IDS_MAP.has(userId)) {
        return;
    }
    const ledgerChannel = await client.channels.fetch(LEDGER_CHANNEL_ID);
    const message = await ledgerChannel.messages.fetch(BOFFO_BALANCE_IDS_MAP.get(userId));

    const balanceNumber = message.content.substring(1).match(/\d/g).join("");

    return parseInt(balanceNumber);
}

async function updateBalanceForUserId(userId, newBalance) {
    const ledgerChannel = await client.channels.fetch(LEDGER_CHANNEL_ID);

    await ledgerChannel.messages.fetch(BOFFO_BALANCE_IDS_MAP.get(userId)).then( message => message.edit(content="₿" + newBalance.toLocaleString("en-US")));
}

async function addToBalanceForUserId(userId, amountToAdd) {
    const ledgerChannel = await client.channels.fetch(LEDGER_CHANNEL_ID);
    const message = await ledgerChannel.messages.fetch(BOFFO_BALANCE_IDS_MAP.get(userId));
    const balanceNumber = parseInt(message.content.substring(1).match(/\d/g).join("")) + amountToAdd;

    await message.edit(content="₿" + balanceNumber.toLocaleString("en-US"));
}

async function getEmoteOwnershipMessage() {
    const ledgerChannel = await client.channels.fetch(LEDGER_CHANNEL_ID);
    const message = await ledgerChannel.messages.fetch(EMOTE_OWNERSHIP_MESSAGE_ID);

    return message;
}

async function addToTransactionHistory(transactionToAdd) {
    const ledgerChannel = await client.channels.fetch(LEDGER_CHANNEL_ID);
    const transactionHistoryMessage = await ledgerChannel.messages.fetch(TRANSACTION_HISTORY_MESSAGE_ID);

    var transactions = transactionHistoryMessage.content.split("\n\n");
    transactions.pop();
    transactions.splice(1, 0, transactionToAdd);

    transactionHistoryMessage.edit(transactions.join("\n\n"));
}

async function trackInterestInTransactionHistory(userId, emote) {
    const ledgerChannel = await client.channels.fetch(LEDGER_CHANNEL_ID);
    const transactionHistoryMessage = await ledgerChannel.messages.fetch(TRANSACTION_HISTORY_MESSAGE_ID);

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

client.on('messageCreate', async (msg) => {
    if (msg.content.charAt(0) != '~' &&
        (msg.author.id != GUN_USER_ID || msg.content.search("acquires") < 0)) {
        await checkForEmotes(msg);
        return;
    }

    // if (msg.content.startsWith("~test")) {
    //     await deleteMsgs(msg.channel);
    //     return;
    // }

    if (msg.content.startsWith("~bid")) {
        const emoteToBuy = msg.content.substring(msg.content.search("<"), msg.content.search(">") + 1);
        
        if (emoteToBuy == "") {
            return;
        }
        msg.channel.sendTyping();
        // verify user has enough ₿ to bid on emote
        const biddingUser = msg.member.id;
        var biddingUserBalance = await getBalanceForUserId(biddingUser);

        var bidAmount = msg.content.split(" ");
        bidAmount = parseInt(bidAmount[bidAmount.length - 1].match(/\d/g).join(""));
        if (isNaN(bidAmount)) {
            msg.channel.send("Invalid amount! " + FACE_EMOTES[randomFaceIndex()]);
            return;
        } else if (bidAmount > biddingUserBalance) {
            msg.channel.send("Insufficient funds! " + FACE_EMOTES[randomFaceIndex()]);
            return;
        }

        const emoteOwnershipMessage = await getEmoteOwnershipMessage();
        var emoteOwnershipMessageContent = emoteOwnershipMessage.content.split("\n");
        // find current ownership
        var emoteOwnerId;
        var emotePrice;
        for (let i = 0; i < emoteOwnershipMessageContent.length; i++) {
            let emoteStringIndex = emoteOwnershipMessageContent[i].search(emoteToBuy);
            if (emoteStringIndex < 0) {
                continue;
            }
            
            var thisOwnershipLine = emoteOwnershipMessageContent[i];

            // Find emote owner
            if (thisOwnershipLine.startsWith("<@")) {
                emoteOwnerId = thisOwnershipLine.substring(2, thisOwnershipLine.search(">"));
                if (emoteOwnerId == biddingUser) {
                    return;
                }
            }

            // find emote price
            emotePrice = thisOwnershipLine.substring(emoteStringIndex + emoteToBuy.length + 1);
            var regExp = /\(([^)]+)\)/;
            emotePrice = regExp.exec(emotePrice)[1];
            var priceLength = emotePrice.length;
            emotePrice = parseInt(emotePrice.match(/\d/g).join(""));

            // Make sure new user can afford
            if (emotePrice >= bidAmount) {
                msg.channel.send("Bid amount must be higher than ₿" + emotePrice + "!");
                return;
            }

            // Remove the emote from this line
            var lengthToTrimFromEnd = emoteToBuy.length + 3 + priceLength;
            if (thisOwnershipLine.charAt(emoteStringIndex + lengthToTrimFromEnd + 1) == "|") {
                lengthToTrimFromEnd += 3;
            } else if (thisOwnershipLine.charAt(emoteStringIndex - 2) == "|") {
                emoteStringIndex -= 3;
                lengthToTrimFromEnd += 3;
            }
            thisOwnershipLine = thisOwnershipLine.substring(0, emoteStringIndex) + thisOwnershipLine.substring(emoteStringIndex + lengthToTrimFromEnd);
            emoteOwnershipMessageContent[i] = thisOwnershipLine;
            break;
        }

        if (emotePrice == null) {
            msg.channel.send("Invalid emote! " + FACE_EMOTES[randomFaceIndex()]);
            return;
        }

        // move ownership to new user
        for (let i = 0; i < emoteOwnershipMessageContent.length; i++) {
            if (emoteOwnershipMessageContent[i].startsWith("<@" + biddingUser + ">")) {
                if (emoteOwnershipMessageContent[i].charAt(emoteOwnershipMessageContent[i].length - 1) == ":") {
                    emoteOwnershipMessageContent[i] += " ";
                } else if (emoteOwnershipMessageContent[i].charAt(emoteOwnershipMessageContent[i].length - 2) != ":") {
                    emoteOwnershipMessageContent[i] += " | ";
                }
                emoteOwnershipMessageContent[i] += emoteToBuy + " (₿" + bidAmount + ")";
                break;
            }

            if (i == emoteOwnershipMessageContent.length - 1) {
                emoteOwnershipMessageContent[emoteOwnershipMessageContent.length] = "<@" + biddingUser + ">'s emotes: " + emoteToBuy + " (₿" + bidAmount + ")";
                break;
            }
        }

        // edit ownership message
        emoteOwnershipMessage.edit(emoteOwnershipMessageContent.join("\n"));

        // charge bidder
        addToBalanceForUserId(biddingUser, -bidAmount);
        // refund old owner
        if (emoteOwnerId) {
            addToBalanceForUserId(emoteOwnerId, emotePrice);
            msg.channel.send(msg.member.displayName + " acquires " + emoteToBuy + " from <@" + emoteOwnerId + "> for ₿" + bidAmount + "!");
            addToTransactionHistory("<t:" + parseInt(Date.now() / 1000) + ":f> " + msg.member.displayName + " acquired " + emoteToBuy + " from <@" + emoteOwnerId + "> for ₿" + bidAmount + ".");
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

        // if (msg.content.startsWith("~allowance")) {
        //     const mentionedUserIds = Array.from( msg.mentions.members.keys() );
        //     var amountToSend = msg.content.split(" ");
        //     amountToSend = parseInt(amountToSend[amountToSend.length - 1].match(/\d/g).join(""));
    
        //     if (isNaN(amountToSend)) {
        //         msg.channel.send("Invalid amount! " + FACE_EMOTES[randomFaceIndex()]);
        //         return;
        //     }
    
        //     for (let i = 0; i < mentionedUserIds.length; i++) {
        //         const toUser = mentionedUserIds[i];
    
        //         addToBalanceForUserId(toUser, amountToSend);
        //         msg.channel.send("Added ₿" + amountToSend.toLocaleString("en-US") + " to " + msg.mentions.members.get(toUser).displayName + "'s balance.");
        //     }
        //     return;
        // }

        if (msg.content.startsWith("~tip")) {
            msg.channel.sendTyping();
            const fromUser = msg.member.id;
            var fromUserBalance = await getBalanceForUserId(fromUser);

            const mentionedUserIds = Array.from( msg.mentions.members.keys() );
            var amountToSend = msg.content.split(" ");
            amountToSend = parseInt(amountToSend[amountToSend.length - 1].match(/\d/g).join(""));

            if (isNaN(amountToSend)) {
                msg.channel.send("Invalid amount! " + FACE_EMOTES[randomFaceIndex()]);
                return;
            }

            for (let i = 0; i < mentionedUserIds.length; i++) {
                const toUser = mentionedUserIds[i];
                var toUserBalance = await getBalanceForUserId(toUser);
                
                if (amountToSend > fromUserBalance ||
                    fromUser == toUser ||
                    fromUserBalance - amountToSend < 0) {
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
    }
    
    if (msg.channel.id === "712134924815040522" ) { // Scoreboard channel
        var collection = await getMovieCollection(msg.channel);
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
            msg.channel.sendTyping();

            const newMovieNumber = movieEntry.substring(0, separatorPos).match(/\d/g).join("");
            const newMovieTitle = movieEntry.substring(separatorPos + 1);

            collection.splice(newMovieNumber - 1, 0, newMovieNumber + ". " + newMovieTitle);
            for (let i = newMovieNumber; i < collection.length; i++) {
                separatorPos = collection[i].indexOf(".");
                
                collection[i] = (+i + +1) + collection[i].substring(separatorPos);
            }


        } else if (msg.content.toLowerCase().startsWith("~remove")) {
            msg.channel.sendTyping();
            const newMovieNumber = movieEntry.match(/\d/g).join("");
            console.log("Removing " + newMovieNumber + ". " + collection[i]);
            collection.splice(newMovieNumber - 1, 1);
            for (let i = newMovieNumber - 1; i < collection.length; i++) {
                separatorPos = collection[i].indexOf(".");
                
                collection[i] = (+i + +1) + collection[i].substring(separatorPos);
            }

            
        } else if (msg.content.toLowerCase().startsWith("~update")) {
            separatorPos = movieEntry.search(" ");
            if (separatorPos < 0) {
                return;
            }
            msg.channel.sendTyping();

            const newMovieNumber = movieEntry.substring(0, separatorPos).match(/\d/g).join("");
            const newMovieTitle = movieEntry.substring(separatorPos + 1);

            collection[newMovieNumber - 1] = newMovieNumber + ". " + newMovieTitle;

        } else {
            return;
        }

        updateScoreBoard(collection, msg.channel);
        msg.delete();
    }
});

client.on('voiceStateUpdate', async (oldState, newState) => {
    if (newState.streaming && newState.channel != null && !oldState.streaming) {
        const currentTimestamp = Date.now();
        const generalChannel = await client.channels.fetch("702142443608473602");
        const messages = await generalChannel.messages.fetch({ limit: 15 }); // Check last 15 messages

        for( let message of messages ) {
            if (currentTimestamp - message[1].createdTimestamp > 4 * 60 * 60 * 1000) { // Check last four hours
                break;
            }
            if (message[1].author.id === GUN_USER_ID && message[1].content.startsWith(newState.member.displayName)) {
                return;
            }
        }
        generalChannel.send(newState.member.displayName + " has gone live!");
    }
});

client.on('messageReactionAdd', async(reaction, user) => {
    if (reaction.message.author.id != user.id && reaction.emoji.id){
        giveEmoteOwnerRoyalties("<:" + reaction.emoji.name + ":" + reaction.emoji.id + ">", user.id);
    }
});

async function giveEmoteOwnerRoyalties(emoteId, userId) {
    const emoteOwnershipMessage = await getEmoteOwnershipMessage();
    var emoteOwnershipMessageContent = emoteOwnershipMessage.content.split("\n");
    // find current ownership
    var emoteOwnerId;
    for (let i = 0; i < emoteOwnershipMessageContent.length; i++) {
        // Find if emote is on this line
        let emoteStringIndex = emoteOwnershipMessageContent[i].search(emoteId);
        if (emoteStringIndex < 0) {
            continue;
        }

        // Find emote owner
        if (emoteOwnershipMessageContent[i].startsWith("<@")) {
            emoteOwnerId = emoteOwnershipMessageContent[i].substring(2, 20);
            if (emoteOwnerId == userId) {
                return;
            }
        }

        // break out if we've found the emote owner
        break;
    }

    if (emoteOwnerId) {
        await addToBalanceForUserId(emoteOwnerId, 1);
        trackInterestInTransactionHistory(emoteOwnerId, emoteId);
    }
}

function shoot(msg, timeoutDuration) {

    var backfire = false;
    var shootMessage = FACE_EMOTES[randomFaceIndex()];
    var tagMessage = "";

    msg.mentions.members.forEach( mentionedMember => {
        if (mentionedMember.id == BEN_USER_ID || mentionedMember.id == GUN_USER_ID) {
          if (msg.member.id != BEN_USER_ID) {
                msg.member.timeout(timeoutDuration * 2);
                tagMessage = "<@" + msg.member.id + ">";
                backfire = true;
            } else {
                return;
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
        shootMessage = GUN_EMOTE + shootMessage;

        if (backfire || timeoutDuration > 20 * 1000) {
            shootMessage = shootMessage + GUN_EMOTE_2;
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
        if (scoreboardMessageCharCount + movieCollection[i].length + 2 > 2000) {
            await channel.messages.fetch(SCOREBOARD_MESSAGE_IDS[scoreboardMessageIndex]).then( message => message.edit(content=scoreboardMessageContent));

            scoreboardMessageIndex++;
            scoreboardMessageContent = "";
            scoreboardMessageCharCount = 0;
            if (scoreboardMessageIndex >= SCOREBOARD_MESSAGE_IDS.length) {
                return;
            }
        }
        if (scoreboardMessageCharCount > 0) {
            scoreboardMessageContent += "\n"; // Unsure whether a newline counts as one or two characters
            scoreboardMessageCharCount += 2;
        }

        scoreboardMessageContent += movieCollection[i];
        scoreboardMessageCharCount += movieCollection[i].length;
    }

    channel.messages.fetch(SCOREBOARD_MESSAGE_IDS[scoreboardMessageIndex]).then( message => message.edit(content=scoreboardMessageContent));
}

function randomFaceIndex() {
    min = Math.ceil(0);
    max = Math.floor(FACE_EMOTES.length);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
  }

client.login(process.env.token);
