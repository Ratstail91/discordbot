//initialize the exports
exports = module.exports = {};

//SendPublicMessage
//client - discord.js client
//user (optional) - discord.js user OR username
//channel - discord.js channel OR channel name
//message - message to send
exports.sendPublicMessage = function(client, user, channel, message) {
	//Handle optional second argument (so much for default arugments in node)
	if (message === undefined) {
		message = channel;
		channel = user;
		user = null;
	}

	//handle user strings
	if (typeof(user) === "string") {
		user = client.users.find(item => item.username === user || item.id === user);
		if (!user) {
			throw "Can't find that user";
		}
	}

	//handle channel strings
	if (typeof(channel) === "string") {
		channel = client.channels.find(item => item.name === channel || item.id === channel);
		if (!channel) {
			throw "Can't find that channel";
		}
	}

	//Utility trick: @user
	if (user !== null) {
		message = "<@" + user.id + "> " + message;
	}

	channel.send(message)
		.catch(console.error);
}

//SendPrivateMessage
//client - discord.js client
//user - discord.js user OR username
//message - message to send
exports.sendPrivateMessage = function(client, user, message) {
	//handle user strings
	if (typeof(user) === "string") {
		user = client.users.find(item => item.username === user || item.id === user);
	}

	user.send(message)
		.catch(console.error);
}

//GenerateDialogFunction
//dialogJson - the json object containing the bot's dialog
//key - Json key
//data (optional) - a number of arguments that are substituted into the resulting string
exports.generateDialogFunction = function(dialogJson) {
	return function(key, ...data) {
		let result;

		if (Array.isArray(dialogJson[key])) {
			result = dialogJson[key][Math.floor(Math.random() * dialogJson[key].length)];
		} else {
			result = dialogJson[key];
		}

		//handle no result
		if (typeof(result) === "undefined") {
			const noResult = dialogJson["noResult"];
			if (typeof(noResult) === "undefined") {
				return ""; //nothing at all to show
			}
			if (Array.isArray(noResult)) {
				result = noResult[Math.floor(Math.random() * noResult.length)];
			} else {
				result = noResult;
	 		 }
		}

		let counter = 0;
		data.map((dat) => {
			counter++;
			result = result.replace(/\{([1-9][0-9]*)\}/g, a => a === "{" + counter + "}" ? dat : a);
		});

		return result;
	}
}

//IsAdmin - DEBUGGING ONLY
//user - discord.js member
exports.isAdmin = function(member) {
	return member.roles.find(role => role.name === process.env.ADMIN_ROLE || role.name === process.env.MOD_ROLE);
}
