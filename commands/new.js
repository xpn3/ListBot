const { tableName } = require('../config.json');
const SQLite = require("better-sqlite3");
const db = new SQLite('data/' + tableName + '.sqlite');

function parseArguments(args) {
  var alias = args[0];
  args.splice(0, 1);
  var title = args.join(' ');
  return [alias, title];
}

function aliasIsUnique(channelId, alias) {
  const found = db.prepare('SELECT COUNT(*) FROM ' + tableName + ' WHERE channelId = ? AND alias = ?').get(channelId, alias);
  return !found;
}

async function createList(channel, title, alias) {
  return await channel.send('**' + title + '** (' + alias + ')');
}

module.exports = {
  name: 'new',
  description: 'Creates a new list.',
  args: true,
  usage: '<list-alias> <list-title>',
	execute(message, args) {
    var parsedArguments = parseArguments(args);
    var alias = parsedArguments[0];
    var title = parsedArguments[1];
    var channel = message.channel;

    const list = db.prepare('SELECT messageId FROM ' + tableName + ' WHERE channelId = ? AND alias = ?').get(channel.id, alias);
    if(typeof list !== 'undefined') {
      throw new Error('List alias "' + alias + '" is already taken. Choose another alias.');
    }

    createList(channel, title, alias)
      .then(createdMessage => {
        db.prepare('INSERT INTO ' + tableName + ' (messageId, alias, channelId) VALUES (?, ?, ?)').run(createdMessage.id, alias, channel.id);
      })  
      .catch(e => {
        console.log(e);
      });
	},
};
