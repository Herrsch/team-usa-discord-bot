const Discord = require('discord.js');
const client = new Discord.Client({
    intents: ["GUILDS", "GUILD_MEMBERS", "GUILD_MESSAGES"]
});
const auth = require('./auth.json');

client.on('ready', () => {
 console.log('Logged in!');
});

client.on('messageCreate', (msg) => {
    if (!msg.content.charAt(0) == '~') {
        return;
    }

    if (msg.content.substring(1, 6) == "shoot") {
        msg.mentions.members.forEach( mentionedMember => {
            // if (mentionedMember.moderatable) {
            // msg.channel.send("<@" + mentionedMember.id + ">");
            mentionedMember.timeout(15 * 1000);
            // } else if (msg.author.moderatable) {
            //     msg.channel.send(mentionedMember.displayName + " cannot be killed. Killing <@" + author.id + ">");
            //     author.timeout(10 * 1000);
            // }
        });
        msg.channel.send("<:dontmakemekillyou:837140610212823050>");
    } else if (msg.content.substring(1, 5) == "kill") {
        msg.mentions.members.forEach( mentionedMember => {
            // msg.channel.send("<@" + mentionedMember.id + ">");
            mentionedMember.timeout(60 * 1000, "bye");
        });
        msg.channel.send("<:dontmakemekillyou:837140610212823050>");
    } else if (msg.content.substring(1, 8) == "silence") {
        let role = msg.guild.roles.cache.find(role => role.name === "shot");
        msg.mentions.members.forEach( mentionedMember => {
            mentionedMember.roles.add(role);
            msg.channel.send("silencing <@" + mentionedMember.id + ">");
        });
    }
});

client.login(auth.token);
