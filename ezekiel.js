// .env Variables
require('dotenv').config({path: './.env'});

// Node Modules
let discord = require('discord.js');
let client = new discord.Client();
//let cron = require('node-cron');

// Bot Modules
let utility = require("./utility.js");

//dialog system
let dialog = utility.generateDialogFunction(require("./dialog.json"));

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

// The ready event is vital, it means that your bot will only start reacting to information from discord _after_ ready is emitted
client.on('ready', async () => {
	// Generates invite link
	try {
		let link = await client.generateInvite(["ADMINISTRATOR"]);
		console.log("Invite Link: " + link);
	} catch(e) {
		console.log(e.stack || e);
	}

	// You can set status to 'online', 'invisible', 'away', or 'dnd' (do not disturb)
	client.user.setStatus('online');

	// Sets your "Playing"
	if (process.env.ACTIVITY) {
		client.user.setActivity(process.env.ACTIVITY, { type: process.env.TYPE })
			//DEBUGGING
			.then(presence => console.log("Activity set to " + (presence.game ? presence.game.name : 'none')) )
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
		return;
	}

	try {
		//admin commands
		if (utility.isAdmin(message.member) && processAdminCommands(client, message)) {
			return;
		}

		//basic user commands
		if (processBasicCommands(client, message)) {
			return;
		}
	} catch(e) {
		console.log(e.stack || e);
	}
});

//Log our bot in
client.login(process.env.TOKEN);

function processBasicCommands(client, message) {
	// "This is the best way to define args. Trust me."
	// - Some tutorial dude on the internet
	let args = message.content.slice(process.env.PREFIX.length).trim().split(/ +/g);
	let command = args.shift().toLowerCase();

	switch (command) {
		case "help":
			utility.sendPublicMessage(client, message.author, message.channel, dialog(command, args[0]));
			return true;

		default:
			utility.sendPublicMessage(client, message.author, message.channel, dialog(command));
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
			utility.sendPublicMessage(client, message.author, message.channel, "PONG!");
			return true;

		case "say":
			utility.sendPublicMessage(client, message.channel, args.join(" "));
			message.delete(10);
			return true;

		case "tell":
			utility.sendPublicMessage(client, args.shift(), message.channel, args.join(" "));
			message.delete(10);
			return true;

		case "whisper":
			utility.sendPrivateMessage(client, args.shift(), args.join(" "));
			message.delete(10);
			return true;		
	}

	return false;
}
