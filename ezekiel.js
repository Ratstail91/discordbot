// .env Variables
require('dotenv').config({path: './.env'});

// Node Modules
let discord = require('discord.js');
let client = new discord.Client();
let { parseAndRoll } = require("roll-parser");

// Bot Modules
let {sendPublicMessage, sendPrivateMessage, generateDialogFunction, isAdmin} = require("./utility.js");

//dialog system
let dialog = generateDialogFunction(require("./dialog.json"));

//ADAM dialog decorator
//NOTE: This isn't strictly necessary for the bots
dialog = function(baseDialog) {
	return function(key, ...data) {
		if (key === "help" && typeof(data[0]) !== "undefined") {
			//force the key and arg into camelCase
			let arg = data[0].toLowerCase();
			arg = arg.charAt(0).toUpperCase() + arg.substr(1);
			key += arg;
		}

		return baseDialog(key, ...data);
	}
}(dialog);

//handle errors
client.on('error', console.error);
client.on('uncaughtException', console.error);

// The ready event is vital, it means that your bot will only start reacting to information from discord _after_ ready is emitted
client.on('ready', async () => {
	/* //don't need this right now, might be left-over from ADAM
	// Generates invite link
	try {
		let link = await client.generateInvite({ permissions: ["SEND_MESSAGES", "MANAGE_MESSAGES"] });
		console.log("Invite Link: " + link);
	} catch(e) {
		console.log(e.stack || e);
	}
	*/

	// You can set status to 'online', 'invisible', 'away', or 'dnd' (do not disturb)
	client.user.setStatus('online');

	// Sets your "Playing"
	if (process.env.ACTIVITY) {
		client.user.setActivity(process.env.ACTIVITY, { type: process.env.TYPE })
			.catch(console.error);
	}

	console.log("Logged in as: " + client.user.username + " - " + client.user.id);
});

// Create an event listener for messages
client.on('message', async message => {
	// Ignores ALL bot messages
	if (message.author.bot) {
		return;
	}

	// Has to be (prefix)command
	if (message.content.indexOf(process.env.PREFIX) !== 0) {
		try {
			passiveResponses(client, message); //watch passively
		} catch(e) {
			console.log(e.stack || e);
		}
		return;
	}

	try {
		//admin commands
		if (isAdmin(message.member) && processAdminCommands(client, message)) {
			return;
		}

		//basic user commands
		if (processBasicCommands(client, message)) {
			return;
		}
	} catch(e) {
		console.error(e.stack || e);
	}
});

//Log our bot in
client.login(process.env.TOKEN);

//handler functions
function passiveResponses(client, message) {
	// "This is the best way to define args. Trust me."
	// - Some tutorial dude on the internet
	let args = message.content.slice(process.env.PREFIX.length).trim().split(/ +/g);
	let command = args.shift().toLowerCase();

	//do passive stuff

	return false;
}

function processBasicCommands(client, message) {
	// "This is the best way to define args. Trust me."
	// - Some tutorial dude on the internet
	let args = message.content.slice(process.env.PREFIX.length).trim().split(/ +/g);
	let command = args.shift().toLowerCase();

	switch (command) {
		case "help":
			sendPublicMessage(client, message.guild, message.author, message.channel, dialog(command, args[0]));
			return true;

		case "roll":
			let roll = parseAndRoll(args);

			if (roll === null) {
				sendPublicMessage(client, message.guild, message.author, message.channel, dialog("noroll"));
				return true;
			}

			sendPublicMessage(client, message.guild, message.author, message.channel, dialog(command, roll.value, roll.rolls.toString() ));
			return true;

		default:
			sendPublicMessage(client, message.guild,  message.author, message.channel, dialog(command));
			return true;
	}

	return false;
}

function processAdminCommands(client, message) {
	// "This is the best way to define args. Trust me."
	// - Some tutorial dude on the internet
	let args = message.content.slice(process.env.PREFIX.length).trim().split(/ +/g);
	let command = args.shift().toLowerCase();

	switch (command) {
		case "ping": //DEBUGGING
			sendPublicMessage(client, message.guild, message.author, message.channel, "PONG!");
			sendPublicMessage(client, "KRGameStudios", "general", "global ping");
			return true;

		case "say":
			sendPublicMessage(client, message.guild, message.channel, args.join(" "));
			message.delete({ timeout: 10 });
			return true;

		case "tell":
			sendPublicMessage(client, message.guild, args.shift(), message.channel, args.join(" "));
			message.delete({ timeout: 10 });
			return true;

		case "whisper":
			sendPrivateMessage(client, args.shift(), args.join(" "));
			message.delete({ timeout: 10 });
			return true;

		case "clean":
			if (isNaN(args[0])) {
				return false;
			}
			message.channel.messages.fetch({ limit: Math.max(0, Math.min(args[0], 100)) }).then(msgs => {
				msgs.map(m => m.delete( { timeout: 10 } ));
			}).catch(console.error);
			return true;
	}

	return false;
}
