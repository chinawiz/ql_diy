// tg_auto_checkin.js
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { Api } from "telegram";

// ======= 配置区 =======
const apiId = 123456;                  // 同上
const apiHash = "xxxxxxxxxxxxxxxxxxxx"; // 同上

// 把第二步得到的整串字符串粘贴到下面引号里
const STRING_SESSION = "PASTE_YOUR_STRING_SESSION_HERE";  

const BOT_USERNAME = "LSMCDTSBOT"; // 目标机器人用户名，不带 @，例：some_checkin_bot  
const CHECKIN_COMMAND = "/sign";      // 发送的签到命令，如 /checkin、/签到 等
// =====================

async function main() {
  const client = new TelegramClient(
    new StringSession(STRING_SESSION),
    apiId,
    apiHash,
    { connectionRetries: 5 }
  );

  await client.connect(); // 用 STRING_SESSION 直接连接

  console.log("已连接 Telegram，开始发送签到消息…");

  try {
    await client.sendMessage(BOT_USERNAME, {
      message: CHECKIN_COMMAND,
    });
    console.log("签到命令已发送：", CHECKIN_COMMAND);
  } catch (err) {
    console.error("发送失败：", err);
  }

  // 青龙任务执行完就退出
  process.exit(0);
}

main();
