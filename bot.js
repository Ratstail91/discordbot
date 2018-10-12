const auth = require("./auth.json");

const { macroGet, macroSet } = require("./macro_tool.js");
const { parseAndRoll } = require("roll-parser");

const Discord = require("discord.js");
const client = new Discord.Client();

//message handler
client.on("ready", function() {
  console.log("Logged in as " + client.user.tag);
  sendToChannel("bot-spam", "I live!");
});

client.on("reconnecting", function() {
  console.log("Reconnecting...");
});

client.on("disconnect", function() {
  console.log("Disconnected");
});

client.on("message", function(msg) {
  //only react to commands
  if (msg.content.slice(0, 1) != "!") {
    return;
  }

  return executeCommand(msg);
});

//command handler
function executeCommand(msg, nestedMacro = false) {
  //echo non-commands (via macros)
  if (msg.content.slice(0, 1) != "!") {
    return sendAtPerson(msg.author, msg.channel, msg.content);
  }

  //get the command
  let command = msg.content.slice(1).split(" ")[0];
  let args = msg.content.slice(1 + command.length).trim();

  //handle command
  switch(command) {
    //used for debugging
    case "ping":
      sendAtPerson(msg.author, msg.channel, "pong");
      break;

    case "help":
      sendToChannel(msg.channel, helpString);
      break;

    case "say":
      msg.delete(10);
      msg.channel.send(msg.content.slice(5, msg.content.length));
      break;

    case "roll": {
      let roll = parseAndRoll(args);

      if (roll === null) {
        return notUnderstood(msg.author, msg.channel);
      }

      sendAtPerson(msg.author, msg.channel,
        "rolled " + roll.value + " (" + roll.rolls.toString() + ")"
      );
    }
    break;

    case "reminder": {
      let delay = args.split(" ")[0];
      let reminder = args.slice(delay.length).trim();

      if (isNaN(parseInt(delay))) {
        return notUnderstood(msg.author, msg.channel);
      }

      client.setTimeout(function() {
        if (reminder.slice(0, 1) === "!") {
          msg.content = reminder;
          return executeCommand(msg);
        } else {
          return sendAtPerson(msg.author, msg.channel, reminder);
        }
      }, parseInt(delay) * 1000);

      sendAtPerson(msg.author, msg.channel, "Reminder set");
    }
    break;

    case "macroset": {
      let name = args.split(" ")[0];
      let cmd = args.slice(1 + name.length).trim();
      if (name.length === 0 || cmd.length === 0) {
        return notUnderstood(msg.author, msg.channel);
      }
      macroSet(msg.author.tag, name, cmd);
      sendAtPerson(msg.author, msg.channel, "Macro set");
    }
    break;

    case "macroget": {
      let name = args.split(" ")[0];
      let macro = macroGet(msg.author.tag, name);
      if (macro === null) {
        return notUnderstood(msg.author, msg.channel);
      }
      sendAtPerson(msg.author, msg.channel, macro);
    }
    break;

    case "macro": {
      if (nestedMacro === true) {
        sendAtPerson(msg.author, msg.channel, "Nested macros disallowed");
        break;
      }

      let name = args.split(" ")[0];
      let macro = macroGet(msg.author.tag, name);
      if (macro === null) {
        return notUnderstood(msg.author, msg.channel);
      }
      msg.content = macro;
      executeCommand(msg, true);
    }
    break;

    //other
      default:
        return notUnderstood(msg.author, msg.channel);
  }
}

//utilities
function sendAtPerson(user, channel, msg) {
  if (typeof(user) === "string") {
    user = client.users.find(usr => usr.username === user);
  }

  if (typeof(channel) === "string") {
    channel = client.channels.find(ch => ch.name === channel);
  }

  channel.send("<@" + user.id + "> " + msg);
}

function sendPrivateMessage(user, msg) {
  if (typeof(user) === "string") {
    client.users.find(usr => usr.username === user).send(msg);
  } else {
    user.send(msg);
  }
}

function sendToChannel(channel, msg) {
  if (typeof(channel) === "string") {
    client.channels.find(ch => ch.name === channel).send(msg);
  } else {
    channel.send(msg);
  }
}

function notUnderstood(user, channel) {
  sendAtPerson(user, channel, "I'm sorry, I don't understand that.");
}

//help utilities
const helpString =
"You can use the following commands with me:\n" +
"\t!help -- Show this message\n" +
"\t!ping -- Used for debugging\n" +
"\n" +
"\t!macroset X Y -- Set the macro X to the value of Y\n" +
"\t!macroget X -- Get the value of macro X\n" +
"\t!macro X -- Execute macro X\n" +
"\n" +
"\t!roll XdY+Z -- Roll X dice of Y sides, with an optional Z modifier\n" +
"\t!reminder X Y -- Send me the message Y after X seconds (can be multiplication)\n"
;

//actually log in
client.login(auth.discordToken);
