const Discord = require('discord.js');
const client = new Discord.Client({
    intents: ["GUILDS", "GUILD_MEMBERS", "GUILD_MESSAGES", "GUILD_VOICE_STATES"]
});
const auth = require('./auth.json');

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
     "<:stung:967970671797887016>"
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

client.on('messageCreate', async (msg) => {
    if (msg.content.charAt(0) != '~') {
        return;
    }

    if (msg.mentions.members.size > 0) {
        if (msg.content.substring(1, 6).toLowerCase() === "shoot") {
            shoot(msg, 15 * 1000);
        } else if (msg.content.substring(1, 5).toLowerCase() === "kill") {
            shoot(msg, 60 * 1000);
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

            const newMovieNumber = movieEntry.substring(0, separatorPos).match(/\d/g).join("");
            const newMovieTitle = movieEntry.substring(separatorPos + 1);

            collection.splice(newMovieNumber - 1, 0, newMovieNumber + ". " + newMovieTitle);
            for (let i = newMovieNumber; i < collection.length; i++) {
                separatorPos = collection[i].indexOf(".");
                
                collection[i] = (+i + +1) + collection[i].substring(separatorPos);
            }


        } else if (msg.content.toLowerCase().startsWith("~remove")) {
            const newMovieNumber = movieEntry.match(/\d/g).join("");
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
        const messages = await generalChannel.messages.fetch({ limit: 10 }); // Check last 10 messages

        for( let message of messages ) {
            if (currentTimestamp - message[1].createdTimestamp > 60 * 60 * 1000) { // Check last hour
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
            scoreboardMessageContent += "\n"; // I THINK a newline only counts as one character
            scoreboardMessageCharCount++;
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
