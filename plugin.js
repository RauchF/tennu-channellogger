const Logger = require("./message-logger");

var ChannelLoggerPlugin = {

    configDefaults: {
        "channellogger": {
            "file": {
                "basepath": "./logs/",
                "pattern": "%c/%Y/%m/%c-%Y-%m-%d.txt"
            },
            "prependLogDate": true,
            "logDateFormat": "hh:MM:ss",
            "noLogPrefix": "!nl",
            "noLogMessage": "This message was not logged."        
        }
    },

    init: function (client, imports) {
        // Initialization of the plugin
        const channels = client.config("channels");
        const network = client.config("server");
        const config = client.config("channellogger");

        var loggers = {};

        for (var channel in channels) {
            loggers[channels[channel]] = new Logger(network, channels[channel], config, client);
        }

        const handleLogSignal = function(logData) {
            if (logData.length !== 2 || logData[0] !== '->'
                || !logData[1].startsWith('PRIVMSG ')
            ) {
                return;
            }

            var matches = logData[1].match(/^PRIVMSG ([#!&+~]\w+) ?: ?(.*)$/);

            if (matches.length !== 3 || channels.indexOf(matches[1]) === -1) {
                return;
            }

            loggers[matches[1]].logLogevent(matches[2]);
        }

        const handleMessage = function(message) {
            if ((message.hasOwnProperty("channel") && message.channel !== "")
                || message.command === "nick"
                || message.command === "quit"
            ) {
                loggers[message.channel].logMessage(message);
            }
        } 

        return {
            handlers: {
                "privmsg": handleMessage,
                "join": handleMessage,
                "part": handleMessage,
                "quit": handleMessage,
                "kick": handleMessage,
                "nick": handleMessage,
                "logemitter:info": handleLogSignal,
                "!dothing": function (command) {
                    return '\u0001ACTION does a thing.\u0001';
                }
            }
        }
    }
}

module.exports = ChannelLoggerPlugin;