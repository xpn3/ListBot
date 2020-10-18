const { tableName } = require('../config.json');
const SQLite = require("better-sqlite3");
const db = new SQLite('./' + tableName + '.sqlite');

const Discord = require('discord.js');
const client = new Discord.Client();

function parseArguments(args) {
  var alias = args[0];
  args.splice(0, 1);
  var newEntry = args.join(' ');
  return [alias, newEntry];
}

function returnsPromise(channel, messageId) {
  return new Promise((resolve, reject) => {
    resolve(channel.messages.fetch(messageId));
  });
}

async function fetchMessage(channel, messageId) {
  return await returnsPromise(channel, messageId);
}

async function addEntry(message, newEntry) {
  await message.edit(message.content + '\n- ' + newEntry);
}

module.exports = {
	name: 'add',
  description: 'Adds a new entry to an existing list.',
  args: true,
  //guildOnly: true,
  usage: '<list-alias> <new-entry>',
	execute(message, args) {
    if(args.length < 2) {
      throw new Error('Too few arguments.');
    }

    var parsedArguments = parseArguments(args);
    var alias = parsedArguments[0];
    var newEntry = parsedArguments[1];
    var channel = message.channel;

    const list = db.prepare('SELECT messageId FROM ' + tableName + ' WHERE channelId = ? AND alias = ?').get(channel.id, alias);

    if(typeof list === 'undefined') {
      throw new Error('Could not find list for alias "' + alias + '". Check alias and try again.');
    }

    fetchMessage(channel, list.messageId)
    .then(fetchedMessage => {
      addEntry(fetchedMessage, newEntry)
        .catch(e => {
          console.log(e);
        });
    })
    .catch(e => {
      console.log(e);
    });
  }
};