// index.js
import { Client, GatewayIntentBits, Partials, Events } from "discord.js";
import express from "express";
import dotenv from "dotenv";
import { roleFlags } from "./roleFlags.js";

dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
  partials: [Partials.GuildMember],
});

client.once(Events.ClientReady, () => {
  console.log(`🤖 Conectado como ${client.user.tag}`);
});

const app = express();
const PORT = process.env.PORT || 3000;
app.get("/", (_req, res) => res.send("⚡ Bot activo"));
app.listen(PORT, () => {
  console.log(`🌐 Servidor escuchando en puerto ${PORT}`);
});

client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
  const added = newMember.roles.cache.filter(
    (r) => !oldMember.roles.cache.has(r.id)
  );
  const removed = oldMember.roles.cache.filter(
    (r) => !newMember.roles.cache.has(r.id)
  );

  for (const role of added.values()) {
    if (roleFlags[role.id]) {
      return applyFlag(newMember, roleFlags[role.id]);
    }
  }

  for (const role of removed.values()) {
    if (roleFlags[role.id]) {
      return cleanFlags(newMember);
    }
  }
});

async function applyFlag(member, flag) {
  const currentNick = member.nickname;
  const base = currentNick
    ? currentNick.replace(/ 🇪🇸| 🇲🇽| 🇦🇷| 🇨🇴| 🇨🇱| 🇧🇴| 🇵🇪| 🇻🇪| 🇪🇨| 🇺🇾/g, "").trim()
    : member.user.username;

  const newNick = `${base} ${flag}`.slice(0, 32);

  try {
    await member.setNickname(newNick);
    console.log(`✅ Nick actualizado a “${newNick}”`);
  } catch (err) {
    console.error("❌ Error cambiando apodo:", err);
  }
}

async function cleanFlags(member) {
  const currentNick = member.nickname;
  if (!currentNick) return;

  const base = currentNick
    .replace(/ 🇪🇸| 🇲🇽| 🇦🇷| 🇨🇴| 🇨🇱| 🇧🇴| 🇵🇪| 🇻🇪| 🇪🇨| 🇺🇾/g, "")
    .trim();

  try {
    if (base === member.user.username) {
      await member.setNickname(null);
      console.log(`✅ Nick restaurado a username por defecto`);
    } else {
      await member.setNickname(base);
      console.log(`✅ Nick restaurado a “${base}”`);
    }
  } catch (err) {
    console.error("❌ Error limpiando apodo:", err);
  }
}

client.login(process.env.BOT_TOKEN);
