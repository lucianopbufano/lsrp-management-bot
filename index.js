require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  AttachmentBuilder
} = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const TOKEN = process.env.TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const SESSIONS_ROLE_ID = process.env.SESSIONS_ROLE_ID;
const SSU_VOTE_THRESHOLD = parseInt(process.env.SSU_VOTE_THRESHOLD) || 5;

let lastSessionMessageId = null;

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  try {

    // =========================
    // SLASH COMMANDS
    // =========================
    if (interaction.isChatInputCommand()) {

      // 🔵 SERVER STARTUP
      if (interaction.commandName === "server_startup") {

        const channel = await client.channels.fetch(CHANNEL_ID);

        const embed = new EmbedBuilder()
          .setTitle("🟢 ERLC Server Startup (SSU)")
          .setDescription(
            `**Liberty State Roleplay** is now **ONLINE**.\n\n` +
            `**Join Code:** LLSSRP`
          )
          .setColor(0x2ED732)
          .setTimestamp();

        const logo = new AttachmentBuilder("./logo.png");

        if (lastSessionMessageId) {
          const oldMsg = await channel.messages.fetch(lastSessionMessageId).catch(() => null);
          if (oldMsg) await oldMsg.delete();
        }

        const sentMessage = await channel.send({
          content: `<@&${SESSIONS_ROLE_ID}>`,
          embeds: [embed],
          files: [logo]
        });

        lastSessionMessageId = sentMessage.id;

        return interaction.reply({ content: "✅ SSU message sent.", ephemeral: true });
      }

      // 🟡 SSU VOTE
      if (interaction.commandName === "ssu_vote") {

        const channel = await client.channels.fetch(CHANNEL_ID);

        const embed = new EmbedBuilder()
          .setTitle("🟡 SSU Vote In Progress")
          .setDescription(
            `A Server Startup vote is now active.\n\n` +
            `• Vote YES only if you can attend\n` +
            `• If passed, YES voters must join\n` +
            `• Vote lasts 10 minutes\n\n` +
            `Required YES Votes: ${SSU_VOTE_THRESHOLD}`
          )
          .setColor(0xFFD700)
          .setTimestamp();

        const yesButton = new ButtonBuilder()
          .setCustomId("vote_yes")
          .setLabel("YES")
          .setStyle(ButtonStyle.Success);

        const noButton = new ButtonBuilder()
          .setCustomId("vote_no")
          .setLabel("NO")
          .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder().addComponents(yesButton, noButton);

        if (lastSessionMessageId) {
          const oldMsg = await channel.messages.fetch(lastSessionMessageId).catch(() => null);
          if (oldMsg) await oldMsg.delete();
        }

        const sentMessage = await channel.send({
          content: `<@&${SESSIONS_ROLE_ID}>`,
          embeds: [embed],
          components: [row]
        });

        lastSessionMessageId = sentMessage.id;

        return interaction.reply({ content: "✅ SSU vote started.", ephemeral: true });
      }

      // 🔵 INFORMATION PANEL
      if (interaction.commandName === "info_panel") {

        const channel = interaction.channel;

        const embed = new EmbedBuilder()
          .setTitle("📘 Liberty State RP Information Panel")
          .setDescription(
            `Use the dropdown menu below to quickly navigate important server resources.\n\n` +
            `Select an option to be redirected.`
          )
          .setColor(0x5865F2);

        const menu = new StringSelectMenuBuilder()
          .setCustomId("info_menu")
          .setPlaceholder("Select an information category")
          .addOptions(
            new StringSelectMenuOptionBuilder()
              .setLabel("Discord Rules")
              .setDescription("View official server Discord rules")
              .setValue("discord_rules"),

            new StringSelectMenuOptionBuilder()
              .setLabel("In-Game Rules")
              .setDescription("Review ERLC roleplay rules")
              .setValue("ingame_rules"),

            new StringSelectMenuOptionBuilder()
              .setLabel("LEO Radio Codes")
              .setDescription("Official police radio codes")
              .setValue("radio_codes"),

            new StringSelectMenuOptionBuilder()
              .setLabel("Support")
              .setDescription("Need help? Open support")
              .setValue("support")
          );

        const row = new ActionRowBuilder().addComponents(menu);

        await channel.send({
          embeds: [embed],
          components: [row]
        });

        return interaction.reply({ content: "✅ Information panel sent.", ephemeral: true });
      }
    }

    // =========================
    // DROPDOWN MENU HANDLER
    // =========================
    if (interaction.isStringSelectMenu()) {

      const value = interaction.values[0];

      const channelMap = {
        discord_rules: "<#1466549648037777570>",
        ingame_rules: "<#1466549648251551906>",
        radio_codes: "<#1466549648251551907>",
        support: "<#1466549648427581686>"
      };

      const selectedChannel = channelMap[value];

      if (!selectedChannel) {
        return interaction.reply({ content: "Channel not configured yet.", ephemeral: true });
      }

      return interaction.reply({
        content: `🔎 Redirecting you to ${selectedChannel}`,
        ephemeral: true
      });
    }

  } catch (error) {
    console.error(error);
  }
});

client.login(TOKEN);
