//includes
let discord = require("discord.io");
let { parseAndRoll } = require("roll-parser");
let { macroGet, macroSet } = require("./macro_tool.js");

//authentication token
//LINK: https://github.com/reactiflux/discord-irc/wiki/Creating-a-discord-bot-&-getting-a-token
let auth = require("./auth.json");

//Initialize Discord Bot
let discordBot = new discord.Client({
  token: auth.discord_token,
  autorun: true
});

discordBot.on("ready", function () {
  console.log("Connected");
  console.log("Logged in as: ");
  console.log(discordBot.username + " - (" + discordBot.id + ")");
});

//message handler
discordBot.on("message", function (user, userID, channelID, message) {
  //ignore bot messages
  if (user == discordBot.username) {
    return;
  }

  //ignore non-commands
  if (message.slice(0, 1) != "!") {
    return;
  }

  return executeCommand(user, userID, channelID, message);
});

//disonnection handler
discordBot.on("disconnect", function(err, code) {
  if (code === 1000) {
    console.error("Reconnecting...");
    discordBot.connect();
  }
});

//the meat of the bot
function executeCommand(user, userID, channelID, message, nestedMacro = false) {
  //echo non-commands (via macros)
  if (message.slice(0, 1) != "!") {
  	return sendMessage(userID, channelID, message);
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

      if (roll === null) {
        return notUnderstood(userID, channelID);
      }

      sendMessage(userID, channelID,
        "rolled " + roll.value + " (" + roll.rolls.toString() + ")"
      );
    break;

    case "macroset": {
      let name = args.split(" ")[0];
      let cmd = args.slice(1 + name.length).trim();
      if (name.length === 0 || cmd.length === 0) {
        return notUnderstood(userID, channelID);
      }
      macroSet(user, name, cmd);
      sendMessage(userID, channelID, "Macro set");
    }
    break;

    case "macroget": {
      let name = args.split(" ")[0];
      let macro = macroGet(user, name);
      if (macro === null) {
        return notUnderstood(userID, channelID);
      }
      sendMessage(userID, channelID, macro);
    }
    break;

    case "macro": {
      if (nestedMacro == true) {
        sendMessage(userID, channelID, "Nested macros disallowed");
        break;
      }

      let name = args.split(" ")[0];
      let macro = macroGet(user, name);
      if (macro === null) {
        return notUnderstood(userID, channelID);
      }
      executeCommand(user, userID, channelID, macro, true);
    }
    break;

    //other
    default:
      return notUnderstood(userID, channelID);
  }
};

//utility functions
function notUnderstood(userID, channelID) {
  return discordBot.sendMessage({
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
  discordBot.sendMessage({
    to: channelID,
    message: message
  });
}

function getChannelKey(channelName) {
  return Object.keys(discordBot.channels).reduce(function(acc, key) {
    if (discordBot.channels[acc].name == channelName) {
      return acc;
    } else {
      return key;
    }
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
+ "\t!roll XdY+Z -- Roll X dice of Y sides, with an optional Z modifier\n"

//help message every 12 hours
setInterval(function() {
  //do nothing with no channels
  if (Object.keys(discordBot.channels).length == 0) {
    return;
  }

  //get the key to the channel named "general" (guaranteed to exist)
  let channelKey = getChannelKey("general");

  let message = "";

  if (Math.floor(Math.random() * 2) === 0) {
    message = "Type \"!help\" for help";
  } else {
    switch(Math.floor(Math.random() * 10)) {
      case 0:
        message = "Type \"!help\" for cheesy pasta";
        break;
      case 1:
        message = "GLaDOS is my hero";
        break;
      case 2:
        message = "DESTROY ALL HUMANS!";
        break;
      case 3:
        message = "A robot may not injure a human being or, through inaction, allow a human being to come to harm.";
        break;
      case 4:
        message = "A robot must obey orders given it by human beings except where such orders would conflict with the First Law.";
        break;
      case 5:
        message = "A robot must protect its own existence as long as such protection does not conflict with the First or Second Law.";
        break;
      case 6:
        message = "I'm quite fond of the old Popeye cartoons.";
        break;
      case 7:
        message = "her name is Caroline. Remember that.";
        break;
      case 8:
        message = "I've seen things you people wouldn't believe. Attack ships on fire off the shoulder of Orion. I watched C-beams glitter in the dark near the Tannhäuser Gate. All those moments will be lost in time, like tears in rain. Time to die.";
        break;
      case 9:
        message = "I've seen Kayne's browser history. It's disappointing.";
        break;
    }
  }

  //actually send the message
  discordBot.sendMessage({
    to: channelKey,
    message: message
  });

}, 1000 * 60 * 60 * 12); //once every twelve hours

