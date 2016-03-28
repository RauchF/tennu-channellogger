var Logger = require("./logger");

var ChannelLogger = {
	init: function (client, imports) {
		// Initialization of the plugin
		var channels = client.config("channels");
		var network = client.config("server");
		var config = client.config("channellogger");

		var loggers = {};

		for (var channel in channels) {
			loggers[channel] = new Logger(network, channels[channel], config);
		}

		var handleMessage = function(message) {
			if ((message.hasOwnProperty("channel") && message.channel !== "")
				|| message.command === "nick"
				|| message.command === "quit"
			) {
				loggers[channel].logMessage(message);
			}
		} 

		return {
			exports: {
			},

			handlers: {
				"privmsg": handleMessage,
				"join": handleMessage,
				"part": handleMessage,
				"quit": handleMessage,
				"kick": handleMessage,
				"nick": handleMessage
			},

			help: {
			},

			commands: []
		}
	}
}

module.exports = ChannelLogger;