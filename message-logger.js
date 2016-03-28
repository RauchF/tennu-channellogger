const fs = require("node-fs");
const dateFormat = require("dateformat");
const format = require("util").format;

function MessageLogger(network, channel, config, client) {
	var logger = this;

	this.network = network;
	this.channel = channel;
	this.filePattern = config.file.pattern;
	this.fileBasePath = config.file.basepath;
	this.prependLogDate = config.prependLogDate;
	this.logDateFormat = config.logDateFormat;

	this.getFileName = function() {
		var fileName = this.filePattern;
		var now = new Date();

		fileName = fileName.replace(/\%c/g, this.channel);
		fileName = fileName.replace(/\%n/g, this.network);
		fileName = fileName.replace(/\%y/g, dateFormat(now, 'yy'));
		fileName = fileName.replace(/\%Y/g, dateFormat(now, 'yyyy'));
		fileName = fileName.replace(/\%m/g, dateFormat(now, 'mm'));
		fileName = fileName.replace(/\%d/g, dateFormat(now, 'dd'));
		fileName = fileName.replace(/\%h/g, dateFormat(now, 'hh'));
		fileName = fileName.replace(/\%H/g, dateFormat(now, 'HH'));
		fileName = fileName.replace(/\%i/g, dateFormat(now, 'MM'));
		fileName = fileName.replace(/\%s/g, dateFormat(now, 'ss'));
		fileName = fileName.replace(/\%t/g, dateFormat(now, 'TT'));
		
		return fileName;
	}

	this.prepareDir = function(path) {
		path = path.replace(/\/[^\/]*$/, '');
		fs.mkdirSync(path, 0755, true);
	}

	this.writeLog = function(text) {
		if (!text) {
			return;
		}

		var path = this.fileBasePath + this.getFileName();

		if (this.prependLogDate) {
			text = dateFormat(new Date(), this.logDateFormat) + ' ' + text;
		}

		this.prepareDir(path);
		fs.appendFileSync(path, text + '\n');
	}

	this.parseMessage = function(message) {
		var text = "";
		// TODO: Enable internationalization
		switch (message.command) {
			case "privmsg":
				if (message.message.startsWith(config.noLogPrefix)) {
					break;
				}

				if (message.message.startsWith('\u0001ACTION ')) {
					text = format(
						'* %s %s', 
						message.nickname, 
						message.message.replace(/^\u0001ACTION |\u0001$/g, '')
					);
				} else {
					text = format('<%s> %s', message.nickname, message.message);
				}
				break;
			
			case "nick":
				text = format('%s is now known as %s.', message.old, message.new);
				break;

			case "join":
				text = format('%s has joined the channel.', message.nickname);
				break;

			case "part":
				if (message.reason) {
					text = format('%s has left the channel (Reason given: "%s").', message.nickname, message.reason);
				} else {
					text = format('%s has left the channel.', message.nickname);
				}
				break;

			case "quit":
				if (message.reason) {
					text = format('%s has quit (Reason given: "%s").', message.nickname, message.reason);
				} else {
					text = format('%s has quit.', message.nickname);
				}
				break;

			case "kick":
				if (message.reason) {
					text = format('%s has kicked %s from the channel (Reason given: "%s").', message.kicker, message.kicked, message.reason);
				} else {
					text = format('%s has kicked %s from the channel.', message.kicker, message.kicked);
				}
				break;
		}

		return text;
	}

	this.parseLogevent = function(text) {
		if (text.startsWith('\u0001ACTION ')) {
			text = format(
				'* %s %s', 
				client.nickname(), 
				text.replace(/^\u0001ACTION |\u0001$/g, '')
			);
		} else {
			text = format('<%s> %s', client.nickname(), text);
		}

		return text;
	}

	return {
		getChannel: function() {
			return logger.channel;
		},
		logMessage: function(message) {
			logger.writeLog(logger.parseMessage(message));
		},
		logLogevent: function(text) {
			logger.writeLog(logger.parseLogevent(text));
		}
	}
}

module.exports = MessageLogger;