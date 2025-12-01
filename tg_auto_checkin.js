// tg_auto_checkin.js  (CommonJS 版，带返回信息输出)
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { Api } = require("telegram");

// ======= 配置区 =======
const apiId = 123456;                   // 同上
const apiHash = "xxxxxxxxxxxxxxxxxxxx"; // 同上

// 把初始化脚本得到的整串字符串粘贴到下面引号里
const STRING_SESSION = "PASTE_YOUR_STRING_SESSION_HERE";

const BOT_USERNAME = "some_checkin_bot"; // 目标机器人用户名，不带 @
const CHECKIN_COMMAND = "/checkin";      // 要发送的签到命令
// =====================

async function main() {
  const client = new TelegramClient(
    new StringSession(STRING_SESSION),
    apiId,
    apiHash,
    { connectionRetries: 5 }
  );

  await client.connect();
  console.log("已连接 Telegram，开始发送签到消息…");

  try {
    // 1. 先解析机器人 peer
    const botEntity = await client.getEntity(BOT_USERNAME);

    // 2. 发送签到命令
    const sendResult = await client.sendMessage(botEntity, {
      message: CHECKIN_COMMAND,
    });
    console.log("签到命令已发送：", CHECKIN_COMMAND);

    // sendResult 里本身就有你发出去的那条消息
    console.log("发送消息的基本信息：", {
      id: sendResult.id,
      date: sendResult.date,
      message: sendResult.message,
    });

    // 3. 等待几秒，让机器人有时间回复
    await new Promise((r) => setTimeout(r, 3000));

    // 4. 拉取机器人最新一条消息（通常就是签到结果）
    const history = await client.getMessages(botEntity, {
      limit: 1,
    });

    if (history && history.length > 0) {
      const replyMsg = history[0];
      console.log("机器人最新一条回复内容：");
      console.log("----------------------------");
      console.log(replyMsg.message); // 纯文本
      console.log("----------------------------");
    } else {
      console.log("没有获取到机器人回复消息。");
    }
  } catch (err) {
    console.error("执行失败：", err);
  } finally {
    process.exit(0);
  }
}

main();
