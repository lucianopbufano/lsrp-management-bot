require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  REST,
  Routes
} = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const TOKEN = process.env.TOKEN;
const SESSIONS_ROLE_ID = process.env.SESSIONS_ROLE_ID;
const CHANNEL_ID = process.env.CHANNEL_ID;

let lastSessionMessage = null;

const commands = [
  { name: 'server_startup', description: 'Announce ERLC server startup' },
  { name: 'server_shutdown', description: 'Announce ERLC server shutdown' },
  { name: 'ssu_vote', description: 'Start an SSU vote' },
  { name: 'info_panel', description: 'Post the Liberty State RP information panel' }
];

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log('Slash commands registered.');
  } catch (error) {
    console.error(error);
  }
})();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const channel = await client.channels.fetch(CHANNEL_ID);

  // STARTUP
  if (interaction.commandName === 'server_startup') {
    const embed = new EmbedBuilder()
      .setTitle('🟢 ERLC Server Startup (SSU)')
      .setDescription('**Liberty State Roleplay** is now **ONLINE**.\n\nJoin with code: **LLSSRP**')
      .setColor(0x2ED32);

    if (lastSessionMessage) await lastSessionMessage.delete().catch(() => {});
    lastSessionMessage = await channel.send({
      content: `<@&${SESSIONS_ROLE_ID}>`,
      embeds: [embed]
    });

    await interaction.reply({ content: 'Startup sent.', ephemeral: true });
  }

  // SHUTDOWN
  if (interaction.commandName === 'server_shutdown') {
    const embed = new EmbedBuilder()
      .setTitle('🔴 ERLC Server Shutdown')
      .setDescription('The server is now **OFFLINE**.')
      .setColor(0xE74C3C);

    if (lastSessionMessage) await lastSessionMessage.delete().catch(() => {});
    lastSessionMessage = await channel.send({
      content: `<@&${SESSIONS_ROLE_ID}>`,
      embeds: [embed]
    });

    await interaction.reply({ content: 'Shutdown sent.', ephemeral: true });
  }

  // SSU VOTE
  if (interaction.commandName === 'ssu_vote') {
    const embed = new EmbedBuilder()
      .setTitle('🟡 SSU Vote In Progress')
      .setDescription(
        'A Server Startup vote is active.\n\n' +
        '• Vote YES only if you can attend\n' +
        '• If passed, YES voters must join\n' +
        '• Vote lasts 10 minutes'
      )
      .setColor(0xF1C40F);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('vote_yes')
        .setLabel('YES')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('vote_no')
        .setLabel('NO')
        .setStyle(ButtonStyle.Danger)
    );

    if (lastSessionMessage) await lastSessionMessage.delete().catch(() => {});
    lastSessionMessage = await channel.send({
      content: `<@&${SESSIONS_ROLE_ID}>`,
      embeds: [embed],
      components: [row]
    });

    await interaction.reply({ content: 'SSU vote started.', ephemeral: true });
  }

  // INFO PANEL
  if (interaction.commandName === 'info_panel') {

    const embed = new EmbedBuilder()
      .setTitle('📘 Liberty State RP Information Panel')
      .setDescription(
        'Use the dropdown menu below to navigate important server resources.\n\n' +
        'Select an option to be redirected.'
      )
      .setColor(0x5865F2);

    const menu = new StringSelectMenuBuilder()
      .setCustomId('info_menu')
      .setPlaceholder('Select an information category')
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('Discord Rules')
          .setDescription('View official server Discord rules')
          .setValue('discord_rules'),

        new StringSelectMenuOptionBuilder()
          .setLabel('In-Game Rules')
          .setDescription('Review ERLC roleplay rules')
          .setValue('ingame_rules'),

        new StringSelectMenuOptionBuilder()
          .setLabel('LEO Radio Codes')
          .setDescription('Official police radio codes')
          .setValue('radio_codes'),

        new StringSelectMenuOptionBuilder()
          .setLabel('Support')
          .setDescription('Open a support ticket or get help')
          .setValue('support')
      );

    const row = new ActionRowBuilder().addComponents(menu);

   client.once("clientReady", async () => {
  try {
    const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );

    console.log("Slash commands registered.");
  } catch (error) {
    console.error(error);
  }
});

    });
  }
});

client.login(TOKEN);
