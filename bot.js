let discord = require('discord.io');
let { parseAndRoll } = require('roll-parser');

let auth = require('./auth.json');

//Initialize Discord Bot
let bot = new discord.Client({
   token: auth.token,
   autorun: true
});

bot.on('ready', function (evt) {
    console.log('Connected');
    console.log('Logged in as: ');
    console.log(bot.username + ' - (' + bot.id + ')');
});

bot.on('message', function (user, userID, channelID, message, evt) {
  //ignore bot messages
  if (user == bot.username) {
    return;
  }

  //ignore non-commands
  if (message.slice(0, 1) != '!') {
    return;
  }

  //get the command
  let command = message.slice(1).split(' ')[0];
  let args = message.slice(1 + command.length).trim();

  switch(command) {
    case 'roll':
      let roll = parseAndRoll(args);
      if (roll != null) {
        bot.sendMessage({
          to: channelID,
          message: user + ' rolled ' + roll.value
        });
        break;
      }

    default:
      bot.sendMessage({
        to: channelID,
        message: 'I\'m sorry, I don\'t understand that.'
      });
      break;
  }
});
