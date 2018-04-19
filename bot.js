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

//message handler
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

    case "help":
      sendMessage(channelID, helpString);
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

    case "macroset":
    case "macroget":
    case "macro":
      sendMessage(userID, channelID, "This feature isn't ready yet.");
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

//help utilities
const helpString = "You can use the following commands with me:\n"
+ "\t!help -- Show this message\n"
+ "\t!ping -- Used for debugging\n"
+ "\n"
+ "\t!macroset X Y -- Set the macro X to the value of Y\n"
+ "\t!macroget X -- Get the value of macro X\n"
+ "\t!macro X -- Execute macro X\n"
+ "\n"
+ "\t!roll XdY -- Roll X dice of Y sides\n"

//help message every 10 minutes
setInterval(function() {

  //do nothing with no channels
  if (Object.keys(bot.channels).length == 0) {
    return;
  }

  //get the key to the channel named "general" (guaranteed to exist)
  let channelKey = Object.keys(bot.channels).reduce(function(acc, key) {
    if (bot.channels[acc].name == "general") {
      return acc;
    } else {
      return key;
    }
  });

  //actually send the message
  bot.sendMessage({
    to: channelKey,
    message: "Type \"!help\" for help"
  });

}, 1000 * 60 * 10);
