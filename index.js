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

// ===== LOGIN =====
client.login(process.env.TOKEN);
