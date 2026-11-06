// Daily funnel digest. Usage: npx tsx scripts/digest.ts [days=7] [--send]
// --send posts it to Telegram when TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are set.
import { digestText } from "../lib/track";

async function main() {
  const args = process.argv.slice(2);
  const days = Number(args.find((a) => /^\d+$/.test(a)) || 7);
  const text = await digestText(days);
  console.log(text);

  if (args.includes("--send")) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chat = process.env.TELEGRAM_CHAT_ID;
    if (!token || !chat) throw new Error("--send needs TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID");
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text }),
    });
    if (!res.ok) throw new Error(`telegram: ${res.status} ${await res.text()}`);
    console.log("\nsent to Telegram");
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
