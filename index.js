/* TODOs
- documentation
- dynamic help command: https://discordjs.guide/command-handling/adding-features.html#a-dynamic-help-command
- allow prefix set
- logging
*/

const { prefix, token, tableName } = require('./config.json');

const Discord = require('discord.js');
const client = new Discord.Client();
client.commands = new Discord.Collection();
const fs = require('fs');

const SQLite = require("better-sqlite3");
const db = new SQLite('./' + tableName + '.sqlite');

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for(const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

client.on('ready', () => {
  try {
    db.prepare('CREATE TABLE IF NOT EXISTS ' + tableName + ' (messageId TEXT PRIMARY KEY, alias TEXT NOT NULL, channelId TEXT NOT NULL)').run();
  } catch(e) {
    console.log(e);
    process.exit(1);
  }
});

const cooldowns = new Discord.Collection();

client.on('message', message => {
  if(!message.content.startsWith(prefix) || message.author.bot) {
    return;
  }

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();
  
  if(!client.commands.has(commandName)) {
    return;
  }

  const command = client.commands.get(commandName);

  if(command.guildOnly && message.channel.type === 'dm') {
    return message.reply('I can\'t execute that command inside DMs!');
  }  

  if(command.args && !args.length) {
    let reply = `You didn't provide any arguments, ${message.author}!`;
    if(command.usage) {
      reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``;
    }
    return message.channel.send(reply);
  }

  // Cooldown (start)
  if(!cooldowns.has(command.name)) {
    cooldowns.set(command.name, new Discord.Collection());
  }
  
  const now = Date.now();
  const timestamps = cooldowns.get(command.name);
  const cooldownAmount = (command.cooldown || 3) * 1000;
  
  if(timestamps.has(message.author.id)) {
    const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

    if(now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000;
      return message.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`);
    }
  }
  timestamps.set(message.author.id, now);
  setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
  // Cooldown (end)

  try {
    command.execute(message, args);
  } catch(e) {
    console.error(e);
    message.channel.send(e.message);
  }
});

client.login(token);
