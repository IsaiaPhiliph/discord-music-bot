// const Discord = require("discord.js");
// const config = require("./config");
// require("dotenv").config();
// const youtubesearchapi = require("youtube-search-api");
// const fs = require("fs");
// const { Transform } = require("stream");
// const ytdl = require("ytdl-core");
// const googleSpeech = require("@google-cloud/speech");

// const queue = new Map();

// function play(guild, song) {
//   const serverQueue = queue.get(guild.id);
//   if (!song) {
//     serverQueue.voiceChannel.leave();
//     queue.delete(guild.id);
//     return;
//   }
//   const dispatcher = serverQueue.connection
//     .play(ytdl(song.url))
//     .on("finish", () => {
//       serverQueue.songs.shift();
//       play(guild, serverQueue.songs[0]);
//     })
//     .on("error", (error) => console.error(error));
//   dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
//   serverQueue.textChannel.send(`Start playing: **${song.title}**`);
// }

// async function getYoutubeUrlFromSearch(search) {
//   const results = await youtubesearchapi.GetListByKeyword(search);
//   const ytUrl = `https://www.youtube.com/watch?v=${results.items[0].id}`;
//   return ytUrl;
// }

// async function execute(search, serverQueue, message) {
//   const songInfo = await ytdl.getInfo(getYoutubeUrlFromSearch(search));
//   const voiceChannel = message.member.voice.channel;
//   const song = {
//     title: songInfo.videoDetails.title,
//     url: songInfo.videoDetails.video_url,
//   };
//   if (!serverQueue) {
//     // Creating the contract for our queue
//     const queueContruct = {
//       textChannel: message.channel,
//       voiceChannel: voiceChannel,
//       connection: null,
//       songs: [],
//       volume: 5,
//       playing: true,
//     };
//     // Setting the queue using our contract
//     queue.set(message.guild.id, queueContruct);
//     // Pushing the song to our songs array
//     queueContruct.songs.push(song);

//     try {
//       // Here we try to join the voicechat and save our connection into our object.
//       const connection = await voiceChannel.join();
//       queueContruct.connection = connection;
//       // Calling the play function to start a song
//       play(message.guild, queueContruct.songs[0]);
//     } catch (err) {
//       // Printing the error message if the bot fails to join the voicechat
//       console.log(err);
//       queue.delete(message.guild.id);
//       return message.channel.send(err);
//     }
//   } else {
//     serverQueue.songs.push(song);
//     console.log(serverQueue.songs);
//     return message.channel.send(`${song.title} has been added to the queue!`);
//   }
// }

// const googleSpeechClient = new googleSpeech.SpeechClient();

// function convertBufferTo1Channel(buffer) {
//   const convertedBuffer = Buffer.alloc(buffer.length / 2);

//   for (let i = 0; i < convertedBuffer.length / 2; i++) {
//     const uint16 = buffer.readUInt16LE(i * 4);
//     convertedBuffer.writeUInt16LE(uint16, i * 2);
//   }

//   return convertedBuffer;
// }

// class ConvertTo1ChannelStream extends Transform {
//   constructor(source, options) {
//     super(options);
//   }

//   _transform(data, encoding, next) {
//     next(null, convertBufferTo1Channel(data));
//   }
// }

// const discordClient = new Discord.Client();

// discordClient.on("ready", () => {
//   console.log(`Logged in as ${discordClient.user.tag}!`);
// });

// discordClient.login(config.discordApiToken);

// discordClient.on("message", async (message) => {
//   if (message.content === "unete") {
//     try {
//       const connection = await message.member.voice.channel.join();
//       const receiver = connection.receiver;
//       connection.on("speaking", (user, speaking) => {
//         if (!speaking) {
//           return;
//         }
//         console.log(`I'm listening to ${user.username}`);
//         const audioStream = receiver.createStream(user, { mode: "pcm" });
//         const requestConfig = {
//           encoding: "LINEAR16",
//           sampleRateHertz: 48000,
//           languageCode: "es-ES",
//         };
//         const request = {
//           config: requestConfig,
//         };
//         const recognizeStream = googleSpeechClient
//           .streamingRecognize(request)
//           .on("error", console.error)
//           .on("data", (response) => {
//             const msg = response.results
//               .map((result) => result.alternatives[0].transcript)
//               .join("\n")
//               .toLowerCase();
//             const transcription = user.username + " dijo: " + msg + "\n";
//             console.log(`Transcription: ${transcription}`);
//             fs.appendFile("message.txt", transcription, function (err) {
//               if (err) throw err;
//               console.log("Saved!");
//             });
//             if (transcription.includes("reproduce")) {
//               const song = msg.substr(transcription.indexOf(" ") + 1);
//               message.channel.send(`/play ${song}`);
//               execute(song);
//               return;
//             }
//             message.channel.send(transcription);
//           });

//         const convertTo1ChannelStream = new ConvertTo1ChannelStream();

//         audioStream.pipe(convertTo1ChannelStream).pipe(recognizeStream);

//         audioStream.on("end", async () => {
//           console.log("audioStream end");
//         });
//       });
//     } catch (err) {
//       console.error(err);
//     }
//   }
//   if (message.content === "vete") {
//     const connection = await message.member.voice.channel.join();
//     connection.disconnect();
//   }
// });
const Discord = require("discord.js");
const { prefix, token } = require("./config.json");
const ytdl = require("ytdl-core");
const youtubesearchapi = require("youtube-search-api");

const queue = new Map();

async function getYoutubeUrlFromSearch(search) {
  const results = await youtubesearchapi.GetListByKeyword(search);
  const ytUrl = `https://www.youtube.com/watch?v=${results.items[0].id}`;
  return ytUrl;
}

try {
  const client = new Discord.Client();

  client.once("ready", () => {
    console.log("Ready!");
  });

  client.once("reconnecting", () => {
    console.log("Reconnecting!");
  });

  client.once("disconnect", () => {
    console.log("Disconnect!");
  });
  client.on("message", async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;

    const serverQueue = queue.get(message.guild.id);

    if (message.content.startsWith(`${prefix}p `)) {
      execute(message, serverQueue);
      return;
    } else if (message.content.startsWith(`${prefix}saltar`)) {
      skip(message, serverQueue);
      return;
    } else if (message.content.startsWith(`${prefix}corta`)) {
      stop(message, serverQueue);
      return;
    } else if (message.content.startsWith(`${prefix}buscar`)) {
      youtubeSearch(message);
    }
    if (message.content.startsWith(`${prefix}ban `)) {
      if (message.member.hasPermission("BAN_MEMBERS")) {
        console.log(message.mentions.users.first());
        if (message.mentions.users.first()) {
          try {
            message.guild.members.ban(message.mentions.users.first());
            message.reply(
              message.mentions.users.first().username + " fue mandado a su casa"
            );
          } catch (err) {
            console.error(err);
            message.reply(
              "No tengo permisos para banear a " +
                message.mentions.users.first().username
            );
          }
        } else {
          message.reply(
            "No tienes permiso para banear a " +
              message.mentions.users.first().username
          );
        }
      } else {
        message.reply(
          "No tienes permiso para banear a " +
            message.mentions.users.first().username
        );
      }
    } else {
      message.channel.send(
        "Introduce un comando valido puto \nComandos validos:\n!p [url o búsqueda] (Reproduce una canción)\n!saltar (Salta una canción en la cola)\n!corta (Parar el bot)\n"
      );
    }
  });

  client.on("error", (err) => {
    console.error(err);
  });

  client.login(token);
} catch (err) {
  console.log(err);
}

async function execute(message, serverQueue) {
  const args = message.content.split(" ");

  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel) {
    return message.channel.send(
      "Necesitas estar en un canal para poner musica tete"
    );
  }
  const permissions = voiceChannel.permissionsFor(message.client.user);
  if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
    return message.channel.send("Necesito permisos para hablar en tu canal!");
  }

  let songInfo, song;

  if (args[1].includes("www.")) {
    songInfo = await ytdl.getInfo(args[1]);
    song = {
      title: songInfo.videoDetails.title,
      url: songInfo.videoDetails.video_url,
    };
  } else {
    const search = args.join(" ").replace("!p ", "");
    const url = await getYoutubeUrlFromSearch(search);
    songInfo = await ytdl.getInfo(url);
    song = {
      title: songInfo.videoDetails.title,
      url: songInfo.videoDetails.video_url,
    };
  }

  if (!serverQueue) {
    const queueContruct = {
      textChannel: message.channel,
      voiceChannel: voiceChannel,
      connection: null,
      songs: [],
      volume: 5,
      playing: true,
    };

    queue.set(message.guild.id, queueContruct);

    queueContruct.songs.push(song);

    try {
      const connection = await voiceChannel.join();
      queueContruct.connection = connection;
      play(message.guild, queueContruct.songs[0]);
    } catch (err) {
      console.log(err);
      queue.delete(message.guild.id);
      return message.channel.send(err);
    }
  } else {
    serverQueue.songs.push(song);
    return message.channel.send(`${song.title} ha sido añadida a la cola`);
  }
}

function skip(message, serverQueue) {
  if (!message.member.voice.channel) {
    return message.channel.send(
      "Tienes que estar en un canal de voz para saltar la música crack!"
    );
  }
  if (!serverQueue) {
    return message.channel.send(
      "No hay ninguna canción para saltar puto inútil"
    );
  }
  serverQueue.connection.dispatcher.end();
}

function stop(message, serverQueue) {
  if (!message.member.voice.channel) {
    return message.channel.send(
      "Tienes que estar en un canal de voz para parar la música crack!"
    );
  }

  if (!serverQueue) {
    return message.channel.send("No hay ningun sonido que parar máquina");
  }

  serverQueue.songs = [];
  serverQueue.connection?.dispatcher.end();
}

async function youtubeSearch(message) {
  const search = message.content.replace("!buscar ", "");
  const results = await youtubesearchapi.GetListByKeyword(search);
  message.channel.send("Resultados de busqueda:");
  let finalMessage = "";
  results.items.forEach((item) => {
    console.log(item);
    finalMessage += item.title + "\n";
  });
  message.channel.send(finalMessage);
}

function play(guild, song) {
  const serverQueue = queue.get(guild.id);
  if (!song) {
    serverQueue.voiceChannel.leave();
    queue.delete(guild.id);
    return;
  }

  const dispatcher = serverQueue.connection
    .play(ytdl(song.url))
    .on("finish", () => {
      serverQueue.songs.shift();
      play(guild, serverQueue.songs[0]);
    })
    .on("error", (error) => console.error(error));
  dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
  serverQueue.textChannel.send(`Reproduciendo: **${song.title}**`);
}
