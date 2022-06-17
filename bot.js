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

const gunRoleId = "938569783320916019";
const benRoleId = "788523219736985631";

client.on('ready', () => {
 console.log('Logged in!');
});

client.on('messageCreate', (msg) => {
    if (!msg.content.charAt(0) == '~' || msg.mentions.members.size === 0) {
        return;
    }

    var timeoutDuration;
    if (msg.content.substring(1, 6) == "shoot") {
        timeoutDuration = 15 * 1000;
    } else if (msg.content.substring(1, 5) == "kill") {
        timeoutDuration = 60 * 1000;
    } else {
        return;
    }

    var backfire = false;

    var shootMessage = faceEmotes[randomFaceIndex()];
    var tagMessage = "";

    msg.mentions.members.forEach( mentionedMember => {
        if (mentionedMember.roles.cache.has(benRoleId) || mentionedMember.roles.cache.has(gunRoleId)) {
            if (!msg.member.roles.cache.has(benRoleId)) {
                msg.member.timeout(timeoutDuration * 2);
                msg.channel.send("<@" + msg.author.id + "> you have made a grave mistake");
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
});

client.on('voiceStateUpdate', (oldState, newState) => {
    if (newState.streaming && newState.channel != null && !oldState.streaming) {
        client.channels.cache.find(channel => channel.name === "general").send(newState.member.displayName + " has gone live!");
    }
});

function randomFaceIndex() {
    min = Math.ceil(0);
    max = Math.floor(faceEmotes.length);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
  }

client.login(auth.token);
