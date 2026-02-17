require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ===== CONFIG =====
const logo = new AttachmentBuilder("./logo.png", { name: "logo.png" });
let lastSessionMessageId = null;

// ===== SLASH COMMANDS =====
const COMMANDS = [
  { name: "server_shutdown", description: "Announce ERLC server shutdown" },
  { name: "server_startup", description: "Announce ERLC server startup" },
  { name: "ssu_vote", description: "Start an SSU vote" }
  { name: "post_information", description: "Post or update the information panel" }

];

// ===== READY =====
client.once("ready", async () => {
  console.log(`✅ LSRP Management online as ${client.user.tag}`);

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
  await rest.put(
    Routes.applicationCommands(client.user.id),
    { body: COMMANDS }
  );
});

// ===== HELPERS =====
async function sendOrEdit(channel, payload) {
  if (lastSessionMessageId) {
    try {
      const msg = await channel.messages.fetch(lastSessionMessageId);
      await msg.edit(payload);
      return msg;
    } catch {}
  }

  const msg = await channel.send(payload);
  lastSessionMessageId = msg.id;
  return msg;
}

function brand(embed) {
  return embed
    .setThumbnail("attachment://logo.png")
    .setFooter({
      text: "LSRP Management • Liberty State Roleplay",
      iconURL: "attachment://logo.png"
    });
}

// ===== INTERACTIONS =====
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  // IMPORTANT: stops "application did not respond"
  await interaction.deferReply({ ephemeral: true });

  try {
    const channel = await client.channels.fetch(process.env.CHANNEL_ID);
    const sessionsPing = `<@&${process.env.SESSIONS_ROLE_ID}>`;

    // 🔴 SHUTDOWN
    if (interaction.commandName === "server_shutdown") {
      const embed = brand(
        new EmbedBuilder()
          .setTitle("🔴 ERLC Server Shutdown")
          .setDescription(
            "**Liberty State Roleplay** is now shutting down.\n\n" +
            "**Please refrain from joining or you will face moderation.**"
          )
          .setColor(0xD32F2F)
          .setTimestamp()
      );

      await sendOrEdit(channel, {
        content: sessionsPing,
        embeds: [embed],
        files: [logo],
        components: []
      });

      return interaction.editReply({ content: "Shutdown message sent." });
    }

    // 🟢 STARTUP
    if (interaction.commandName === "server_startup") {
      const embed = brand(
        new EmbedBuilder()
          .setTitle("🟢 ERLC Server Startup (SSU)")
          .setDescription(
            "**Liberty State Roleplay** is now **ONLINE**.\n\n" +
            "**Join the server with code:** `LLSSRP`"
          )
          .setColor(0x2E7D32)
          .setTimestamp()
      );

      await sendOrEdit(channel, {
        content: sessionsPing,
        embeds: [embed],
        files: [logo],
        components: []
      });

      return interaction.editReply({ content: "SSU message sent." });
    }
if (interaction.commandName === "post_information") {
  const channel = await client.channels.fetch(process.env.INFORMATION_CHANNEL_ID);

  const embed = new EmbedBuilder()
    .setTitle("ℹ️ Liberty State Roleplay — Information Hub")
    .setDescription(
      "Use the menu below to quickly access important server resources.\n\n" +
      "Please review all applicable rules and information before participating."
    )
    .setColor(0x1E3A8A)
    .setThumbnail("attachment://logo.png")
    .setFooter({
      text: "LSRP Management • Information Panel",
      iconURL: "attachment://logo.png"
    });

  const menu = new StringSelectMenuBuilder()
    .setCustomId("info_select")
    .setPlaceholder("Select a category to view")
    .addOptions(
      {
        label: "Discord Rules",
        description: "Community rules and Discord moderation policies",
        value: "discord_rules",
        emoji: "📜"
      },
      {
        label: "In-Game Rules",
        description: "ERLC gameplay rules and RP standards",
        value: "ingame_rules",
        emoji: "🚓"
      },
      {
        label: "LEO Radio Codes",
        description: "Official law enforcement radio codes",
        value: "leo_codes",
        emoji: "📻"
      },
      {
        label: "Support & Tickets",
        description: "Open a ticket or contact staff",
        value: "support",
        emoji: "🎫"
      },
      {
        label: "Sessions & Startups",
        description: "SSU votes, join codes, and server status",
        value: "sessions",
        emoji: "📅"
      }
    );

  const row = new ActionRowBuilder().addComponents(menu);

  await sendOrEdit(channel, {
    embeds: [embed],
    components: [row],
    files: [logo]
  });

  return interaction.reply({ content: "Information panel posted.", ephemeral: true });
}
    // 🟡 SSU VOTE
    if (interaction.commandName === "ssu_vote") {
      let yesVotes = new Set();

      const embed = brand(
        new EmbedBuilder()
          .setTitle("🟡 SSU Vote In Progress")
          .setDescription(
            "**A Server Startup vote is now active.**\n\n" +
            "• Vote **YES** only if you can attend\n" +
            "• If passed, **YES voters must join**\n" +
            "• Vote lasts **10 minutes**\n\n" +
            `✅ Required YES votes: **${process.env.SSU_VOTE_THRESHOLD}**`
          )
          .setColor(0xF9A825)
          .setTimestamp()
      );

      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("yes")
          .setLabel("✅ YES")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId("no")
          .setLabel("❌ NO")
          .setStyle(ButtonStyle.Danger)
      );

      const msg = await sendOrEdit(channel, {
        content: sessionsPing,
        embeds: [embed],
        files: [logo],
        components: [buttons]
      });

      const collector = msg.createMessageComponentCollector({
        time: 10 * 60 * 1000
      });

      collector.on("collect", async i => {
        if (i.customId === "yes") yesVotes.add(i.user.id);
        if (i.customId === "no") yesVotes.delete(i.user.id);
        await i.reply({ content: "Vote recorded.", ephemeral: true });
      });

      collector.on("end", async () => {
        const passed = yesVotes.size >= Number(process.env.SSU_VOTE_THRESHOLD);
        const mentions = [...yesVotes].map(id => `<@${id}>`).join(" ");

        const result = brand(
          new EmbedBuilder()
            .setTitle(passed ? "🟢 ERLC Server Startup (SSU)" : "🔴 SSU Vote Failed")
            .setDescription(
              passed
                ? "**The SSU vote has PASSED.**\n\n**Join Code:** `LLSSRP`"
                : "The vote did not receive enough YES votes."
            )
            .setColor(passed ? 0x2E7D32 : 0xD32F2F)
            .setTimestamp()
        );

        await msg.edit({
          content: passed ? `${sessionsPing}\n${mentions}` : sessionsPing,
          embeds: [result],
          components: [],
          files: [logo]
        });
      });

      return interaction.editReply({ content: "SSU vote started." });
    }
  } catch (err) {
    console.error("COMMAND ERROR:", err);
    return interaction.editReply({
      content: "❌ An internal error occurred. Check channel ID and bot permissions."
    });
  }
});
if (interaction.isStringSelectMenu() && interaction.customId === "info_select") {
  const selection = interaction.values[0];

  const map = {
    discord_rules: process.env.DISCORD_RULES_CHANNEL_ID,
    ingame_rules: process.env.INGAME_RULES_CHANNEL_ID,
    leo_codes: process.env.LEO_CODES_CHANNEL_ID,
    support: process.env.SUPPORT_CHANNEL_ID,
    sessions: process.env.SESSIONS_CHANNEL_ID
  };

  const descriptions = {
    discord_rules: "📜 **Discord Rules**\nCommunity conduct and Discord moderation policies.",
    ingame_rules: "🚓 **In-Game Rules**\nERLC gameplay rules and RP standards.",
    leo_codes: "📻 **LEO Radio Codes**\nLaw enforcement communication codes.",
    support: "🎫 **Support & Tickets**\nOpen a ticket or contact staff.",
    sessions: "📅 **Sessions & Startups**\nSSU votes, join codes, and server status."
  };

  await interaction.reply({
    content: `${descriptions[selection]}\n\n➡️ <#${map[selection]}>`,
    ephemeral: true
  });
}

// ===== LOGIN =====
client.login(process.env.TOKEN);
