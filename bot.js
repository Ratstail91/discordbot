//includes
let discord = require("discord.io");
let { parseAndRoll } = require("roll-parser");

//authentication token
//LINK: https://github.com/reactiflux/discord-irc/wiki/Creating-a-discord-bot-&-getting-a-token
let auth = require("./auth.json");

//Initialize Discord Bot
let bot = new discord.Client({
   token: auth.token,
   autorun: true
});

bot.on("ready", function (evt) {
    console.log("Connected");
    console.log("Logged in as: ");
    console.log(bot.username + " - (" + bot.id + ")");
});

bot.on("message", function (user, userID, channelID, message, evt) {
  //ignore bot messages
  if (user == bot.username) {
    return;
  }

  //ignore non-commands
  if (message.slice(0, 1) != "!") {
    return;
  }

  //get the command
  let command = message.slice(1).split(" ")[0];
  let args = message.slice(1 + command.length).trim();

  //handle the command
  switch(command) {
    //used for debugging
    case "ping":
      sendMessage(channelID, "pong!");
      sendMessage(userID, channelID, "pang!");
    break;

    //rolling dice (TODO: needs a better parsing library)
    case "roll":
      let roll = parseAndRoll(args);

      if (roll == null) {
        return notUnderstood(userID, channelID);
      }

      sendMessage(userID, channelID,
        "rolled " + roll.value + " (" + roll.rolls.toString() + ")"
      );
    break;

    //other
    default:
      return notUnderstood(userID, channelID);
  }
});

//utility functions
function notUnderstood(userID, channelID) {
  return bot.sendMessage({
    to: channelID,
    message: "I'm sorry <@" + userID + ">, I don't understand that."
  });
}

function sendMessage(userID, channelID, message) {
  //handle optional first argument(so much for default arugments in node)
  if (message == undefined) {
    message = channelID;
    channelID = userID;
    userID = null;
  }

  //utility trick (@userID with an optional argument)
  if (userID != null) {
    message = "<@" + userID + "> " + message
  }

  //finally
  bot.sendMessage({
    to: channelID,
    message: message
  });
}
