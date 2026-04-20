# The Bank of Boffo Discord Bot
This is a discord bot that I built for my personal server with my friends. It's partly been an exercise in learning Javascript and Typescript, but it's mostly a vector for us to maintain ongoing elaborate bits. The bot's functionality includes:

1. [Go Live Notifications](#go-live-notifications)
2. [Shoot](#shoot)
3. [Movie Scoreboard](#movie-scoreboard)
4. [The Bank of Boffo](#the-bank-of-boffo)
    1. [Emote Bidding Economy](#emote-bidding-economy)
    2. [Boffo Purchases](#boffo-purchases)

## Go Live Notifications
The original purpose of the bot was just to send out a notification when someone starts streaming in the server's voice channel. This was mostly a selfish use case, as I'm not always looking at discord, and I didn't want to miss when my friends were hanging out. I think people ended up liking this feature though, as it is a very low-social-pressure way to signal to everyone else that they are down to hang, and everyone else doesn't feel pressured to join if they aren't free.

<img width="302" height="202" alt="Screenshot 2026-04-18 at 2 46 40 PM" src="https://github.com/user-attachments/assets/bc7b3bac-6ad1-4eab-912e-dfe0fe57657f" />


## Shoot
You may have noticed that the bot's discord name is Gun. This brings us to the second inital purpose. The bot can be used to 'shoot' anyone in the server to give them a 10 second timeout from posting. This is generally used for when someone makes a really terrible joke. Has the added effect of kicking them out of the voice channel if they're in it.

<img width="638" height="632" alt="Screenshot 2026-04-18 at 2 55 52 PM" src="https://github.com/user-attachments/assets/d7350423-853a-4042-92a3-a8707506312b" />

<img width="887" height="705" alt="Screenshot 2026-04-18 at 2 56 39 PM" src="https://github.com/user-attachments/assets/6e39a7eb-1608-4443-9951-501bb872197a" />

<img width="481" height="685" alt="Screenshot 2026-04-18 at 3 00 03 PM" src="https://github.com/user-attachments/assets/c522b751-003f-4577-b23a-1ba1f5df8ea4" />

The bot was originally named Gun after the weapon, but after we watched Tampopo (1985) we renamed it after Ken Watanabe's character.
<img width="227" height="365" alt="Screenshot 2026-04-18 at 3 02 57 PM" src="https://github.com/user-attachments/assets/23329a5a-a399-41ca-9e73-e1c4dc28ffc7" />

## Movie Scoreboard
Every week, we watch a movie together, and rate it on one massive scoreboard. We had been updating the scoreboard numbering manually, which meant that whenever we added a movie near the top of the scoreboard, we'd need to manually update the number of every movie below it. The bot now handles the scoreboard, we just have commands to add, remove or update entries on the list and it handles the numbering, and also posts the update to our #general channel.
<img width="585" height="438" alt="Screenshot 2026-04-18 at 3 11 49 PM" src="https://github.com/user-attachments/assets/8cdcad50-e4f9-47f8-8ef1-265d82da97cb" />

<img width="405" height="63" alt="Screenshot 2026-04-18 at 3 10 42 PM" src="https://github.com/user-attachments/assets/45fc4402-201c-4e77-9f83-af15b2c5b484" />

## The Bank of Boffo
The economic revolution of our discord server happened in February 2023. While watching Matilda (1996), Danny DeVito's character refers to money as "big american boffos." This launched us into making jokes about investing big into boffos. Before long, the Bank of Boffo was formed.
<img width="418" height="734" alt="Screenshot 2026-04-18 at 3 16 25 PM" src="https://github.com/user-attachments/assets/b466dc83-c1e2-4669-9bb0-61e42c471899" />
**Important Note: Despite us using the ₿ symbol, this is not related to bitcoin or crypto. We just used it because Boffo starts with 'B'.**
Boffos are a fake monopoly money that we earn and spend on our server. Every time we watch a movie together and add it to the scoreboard, each user that is in the voice call gets 10 boffos. Everyone's account balance is tracked in a #ledger channel, and is maintained by the bot. Users can send boffos to each other, or spend them on a few different things, outlined below.
<img width="809" height="255" alt="Screenshot 2026-04-18 at 3 23 51 PM" src="https://github.com/user-attachments/assets/30b6746a-c9e7-4229-ba12-c025fa7cee27" />

### Emote Bidding Economy
Every custom emote in our server can be owned. Users can "bid" any number of boffos from their balance to claim an emote. If another user bids higher, the emote transfers to them, and the original owner gets their bid back. Whenever an emote is used on the server, the emote's owner gets one boffo of "interest". We intentionally do not track the overall stats for which emotes are the most used, because it's funnier when the market is based off of perceived value.
<img width="1028" height="154" alt="Screenshot 2026-04-18 at 3 20 40 PM" src="https://github.com/user-attachments/assets/98bd2afd-51cc-4424-ac0d-545a854fc973" />
<img width="422" height="502" alt="Screenshot 2026-04-18 at 3 26 46 PM" src="https://github.com/user-attachments/assets/b0b0bc7f-ee56-4314-b3c5-279dd46b44f9" />

### Boffo Purchases
The big boffo sinks are based around which movie we're watching on the given week. Users can spend boffos to bump their movie suggestion up in our queue, or they can spend much more to veto whatever movie we have queued up for that week. We talked for a while about potential uses, but I chose to be very careful about what social situations I was designing for, since there are a lot of potential uses that could leave someone feeling upset or bullied. Overall, we want things like the veto to be possible, but very rare and expensive. We're a group that loves to stick to a bit, so we've had a lot of fun with this system, and we're continuing to use it each week.
<img width="983" height="113" alt="Screenshot 2026-04-18 at 3 30 04 PM" src="https://github.com/user-attachments/assets/5258679a-d8a8-4586-b31b-cd63c9326218" />
<img width="1604" height="490" alt="01D4E178-1A43-4632-AA3B-C88108774DD6_1_105_c" src="https://github.com/user-attachments/assets/f906b17a-8e05-4dac-8193-846239d5f4f0" />
