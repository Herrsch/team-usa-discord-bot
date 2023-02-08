const Discord = require('discord.js');
const client = new Discord.Client({
    intents: ["GUILDS", "GUILD_MEMBERS", "GUILD_MESSAGES", "GUILD_VOICE_STATES"]
});
const auth = require('./auth.json');
// const wait = require('util').promisify(setTimeout); // can use this to wait(1000) if need

const gunEmote = "<:kaboom:938830966800150539>";
const gunEmote2 = "<:kaboom2:938856552532676678>";
const faceEmotes = [
     "<:Garrett:815754301224779797>",
     "<:Jeb:788583309075939381>",
     "<:abu:788578719726960710>",
     "<:announcement:847274686135664640>",
     "<:beep:788578684336472068>",
     "<:chromebook:788964896309903370>",
     "<:codepurple:906366020153913454>",
     "<:dey:886797975572086835>",
     "<:dontmakemekillyou:837140610212823050>",
     "<:fast:788527751610892308>",
     "<:gooby:791486603595874366>",
     "<:howembarrassing:815755068375826545>",
     "<:lola:794015396121280522>",
     "<:mano:788578649452052540>",
     "<:momwasrightaboutyou:919799591669497927>",
     "<:myqueen:804950697883205633>",
     "<:nathanielbait:852338398273470505>",
     "<:nuntooshabby:808199411053756426>",
     "<:pleasestop:897146206105530378>",
     "<:ploggers:816871218837323786>",
     "<:poggers:810693855933759518>",
     "<:preach:890421423468871720>",
     "<:squattersrights:869787818287841300>",
     "<:ted:788578667072716811>",
     "<:thomasiamcompletelyspeechless:847300197548556318>",
     "<:trapped:805608831535153221>",
     "<:uhoh:795491005406380034>",
     "<:yikes:810686117891932170>",
     "<:yousureaboutthat:810692238472249345>",
     "<:bust:954607891476807740>",
     "<:lazarwolf:955293614907465738>",
     "<:stung:967970671797887016>",
     "<:goodboy:1071996889312014386>",
     "<:redalert:1071997535591350384>"
];

const gunUserId = "938529523811627038";
const benUserId = "410621256140980225";

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

client.on('ready', () => {
 console.log('Logged in!');
});

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

async function getBalanceForUserId(userId) {
    if (!boffoBalanceIDsMap.has(userId)) {
        return;
    }
    const ledgerChannel = await client.channels.fetch("1072168363129835560");
    const message = await ledgerChannel.messages.fetch(boffoBalanceIDsMap.get(userId));

    const balanceNumber = message.content.substring(1).match(/\d/g).join("");

    return parseInt(balanceNumber);
}

async function updateBalanceForUserId(userId, newBalance) {
    const ledgerChannel = await client.channels.fetch("1072168363129835560");

    await ledgerChannel.messages.fetch(boffoBalanceIDsMap.get(userId)).then( message => message.edit(content="₿" + newBalance));
}

async function deleteMsgs(channel) {
    var messages = await channel.messages.fetch({ limit: 15 });

    messages.forEach( message => {
        message.delete();
    });
}

client.on('messageCreate', async (msg) => {
    if (msg.content.charAt(0) != '~') {
        return;
    }

    // if (msg.content.startsWith("~test")) {
    //     await deleteMsgs(msg.channel);
    //     return;
    // }

    /*
    if (msg.content.startsWith("~bank")) {
        msg.channel.send(".");
        await wait(1000);
        msg.channel.send(".");
        await wait(1000);
        msg.channel.send(".");
        await wait(1000);
        msg.channel.send(".");
        await wait(1000);
        msg.channel.send("Commands:\n`~tip @user #`");
        await wait(1000);
        msg.channel.send("**~The Bank of ₿offos~**\n~~                                          ~~");
        await wait(1000);
        msg.channel.send("<@410621256140980225>:"); // Ben
        await wait(1000);
        msg.channel.send("₿100");
        await wait(1000);
        msg.channel.send("~~                                          ~~");
        await wait(1000);
        msg.channel.send("<@206973395517177856>:"); // John
        await wait(1000);
        msg.channel.send("₿100");
        await wait(1000);
        msg.channel.send("~~                                          ~~");
        await wait(1000);
        msg.channel.send("<@424031474661064715>:"); // Adam
        await wait(1000);
        msg.channel.send("₿100");
        await wait(1000);
        msg.channel.send("~~                                          ~~");
        await wait(1000);
        msg.channel.send("<@206975381067137025>:"); // Dylan
        await wait(1000);
        msg.channel.send("₿100");
        await wait(1000);
        msg.channel.send("~~                                          ~~");
        await wait(1000);
        msg.channel.send("<@701085890117632075>:"); // Garrett
        await wait(1000);
        msg.channel.send("₿1,000");
        await wait(1000);
        msg.channel.send("~~                                          ~~");
        await wait(1000);
        msg.channel.send("<@282597947064057856>:"); // Gene
        await wait(1000);
        msg.channel.send("₿100");
        await wait(1000);
        msg.channel.send("~~                                          ~~");
        await wait(1000);
        msg.channel.send("<@281984105523183616>:"); // Nathaniel
        await wait(1000);
        msg.channel.send("₿100");
        await wait(1000);
        msg.channel.send("~~                                          ~~");
        await wait(1000);
        msg.channel.send("<@746882782596431872>:"); // Maren
        await wait(1000);
        msg.channel.send("₿100");
        await wait(1000);
        msg.channel.send("~~                                          ~~");
        await wait(1000);
        msg.channel.send("<@206968933725503488>:"); // Joe
        await wait(1000);
        msg.channel.send("₿100");
        await wait(1000);
        msg.channel.send("~~                                          ~~");
        await wait(1000);
        msg.channel.send("<@209463935009685506>:"); // Ted
        await wait(1000);
        msg.channel.send("₿100");
        await wait(1000);
        msg.channel.send("~~                                          ~~");
        return;
    }*/

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
        //     amountToSend = parseInt(amountToSend[amountToSend.length - 1]);

        //     if (isNaN(amountToSend)) {
        //         msg.channel.send("Invalid amount! " + faceEmotes[randomFaceIndex()]);
        //         return;
        //     }

        //     for (let i = 0; i < mentionedUserIds.length; i++) {
        //         const toUser = mentionedUserIds[i];

        //         updateBalanceForUserId(toUser, amountToSend);
        //         msg.channel.send(msg.mentions.members.get(toUser).displayName + "'s balance: ₿" + amountToSend);
        //     }
        //     return;
        // }

        if (msg.content.startsWith("~tip")) {
            msg.channel.sendTyping();
            const fromUser = msg.member.id;
            var fromUserBalance = await getBalanceForUserId(fromUser);

            const mentionedUserIds = Array.from( msg.mentions.members.keys() );
            var amountToSend = msg.content.split(" ");
            amountToSend = parseInt(amountToSend[amountToSend.length - 1]);

            if (isNaN(amountToSend)) {
                msg.channel.send("Invalid amount! " + faceEmotes[randomFaceIndex()]);
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
            if (message[1].author.id === gunUserId && message[1].content.startsWith(newState.member.displayName)) {
                return;
            }
        }
        generalChannel.send(newState.member.displayName + " has gone live!");
    }
});

function shoot(msg, timeoutDuration) {

    var backfire = false;
    var shootMessage = faceEmotes[randomFaceIndex()];
    var tagMessage = "";

    msg.mentions.members.forEach( mentionedMember => {
        if (mentionedMember.id == benUserId || mentionedMember.id == gunUserId) {
          if (msg.member.id != benUserId) {
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
        if (scoreboardMessageCharCount + movieCollection[i].length + 2 > 2000) {
            await channel.messages.fetch(scoreboardMessageIds[scoreboardMessageIndex]).then( message => message.edit(content=scoreboardMessageContent));

            scoreboardMessageIndex++;
            scoreboardMessageContent = "";
            scoreboardMessageCharCount = 0;
            if (scoreboardMessageIndex >= scoreboardMessageIds.length) {
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

    channel.messages.fetch(scoreboardMessageIds[scoreboardMessageIndex]).then( message => message.edit(content=scoreboardMessageContent));
}

function randomFaceIndex() {
    min = Math.ceil(0);
    max = Math.floor(faceEmotes.length);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
  }

client.login(auth.token);
