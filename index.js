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

// REGISTER COMMANDS (Guild = instant update)
client.once('clientReady', async () => {
  try {
    const rest = new REST({ version: '10' }).setToken(TOKEN);

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );

    console.log('Slash commands registered.');
  } catch (error) {
    console.error(error);
  }
});

client.on('interactionCreate', async interaction => {

  // Slash commands
  if (interaction.isChatInputCommand()) {

    const channel = await client.channels.fetch(CHANNEL_ID);

    // STARTUP
    if (interaction.commandName === 'server_startup') {
      const embed = new EmbedBuilder()
        .setTitle('🟢 ERLC Server Startup (SSU)')
        .setDescription('**Liberty State Roleplay** is now **ONLINE**.\n\nJoin with code: **LLSSRP**')
        .setColor(0x2ECC71);

      if (lastSessionMessage) await lastSessionMessage.delete().catch(() => {});
      lastSessionMessage = await channel.send({
        content: `<@&${SESSIONS_ROLE_ID}>`,
        embeds: [embed]
      });

      return interaction.reply({ content: 'Startup sent.', ephemeral: true });
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

      return interaction.reply({ content: 'Shutdown sent.', ephemeral: true });
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

      return interaction.reply({ content: 'SSU vote started.', ephemeral: true });
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
          {
            label: 'Discord Rules',
            description: 'View official server Discord rules',
            value: 'discord_rules'
          },
          {
            label: 'In-Game Rules',
            description: 'Review ERLC roleplay rules',
            value: 'ingame_rules'
          },
          {
            label: 'LEO Radio Codes',
            description: 'Official police radio codes',
            value: 'radio_codes'
          },
          {
            label: 'Support',
            description: 'Open a support ticket or get help',
            value: 'support'
          }
        );

      const row = new ActionRowBuilder().addComponents(menu);

      await interaction.reply({
        embeds: [embed],
        components: [row]
      });
    }
  }
});

client.login(TOKEN);