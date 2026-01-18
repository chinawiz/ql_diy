// tg_auto_checkin.js  (CommonJS 版 - 环境变量配置版)
// 功能：从环境变量读取配置，支持多账号，智能等待回复
// 环境变量设置说明（在青龙面板或 .env 文件中设置）：
// TG_API_ID=123456
// TG_API_HASH=xxxxxxxxxxxxxxxxxxxx
// TG_SESSION=session_string_1&session_string_2  (多个账号用 & 或换行连接)
// TG_BOT_USERNAME=LSMCDLXBOT
// TG_CHECKIN_CMD=/sign

const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");

// ======= 配置区 (环境变量) =======
const API_ID = parseInt(process.env.TG_API_ID);
const API_HASH = process.env.TG_API_HASH;
const SESSIONS_ENV = process.env.TG_SESSION; // 支持多账号
const BOT_USERNAME = process.env.TG_BOT_USERNAME || "LSMCDLXBOT"; // 默认目标
const CHECKIN_COMMAND = process.env.TG_CHECKIN_CMD || "/sign";    // 默认命令
// ===============================

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runTask(sessionStr, index) {
  console.log(`\n=== 正在执行第 ${index + 1} 个账号 ===`);
  
  if (!sessionStr) return;

  const client = new TelegramClient(
    new StringSession(sessionStr),
    API_ID,
    API_HASH,
    { 
      connectionRetries: 5, 
      useWSS: false // 提高容器环境稳定性
    }
  );

  try {
    await client.connect();
    console.log("✅ 已连接 Telegram");

    // 1. 获取机器人信息
    const botEntity = await client.getEntity(BOT_USERNAME);

    // 2. 发送签到命令
    console.log(`📤 发送命令: ${CHECKIN_COMMAND} -> ${BOT_USERNAME}`);
    const sendResult = await client.sendMessage(botEntity, {
      message: CHECKIN_COMMAND,
    });
    const sendTime = sendResult.date; // 记录发送时间

    // 3. 智能轮询等待回复 (最多尝试 5 次，每次 3 秒)
    let replyMsg = null;
    const maxRetries = 5;
    
    for (let i = 1; i <= maxRetries; i++) {
        process.stdout.write(`⏳ 等待回复 (${i}/${maxRetries})... `);
        await sleep(3000); 

        // 拉取最新一条消息
        const history = await client.getMessages(botEntity, { limit: 1 });
        
        if (history && history.length > 0) {
            const latestMsg = history[0];
            // 校验时间戳：必须是发送命令之后的回复
            if (latestMsg.date > sendTime) {
                console.log("\n✅ 收到新回复！");
                replyMsg = latestMsg;
                break;
            }
        }
    }
    console.log(""); // 换行

    // 4. 输出结果
    console.log("----------------------------");
    if (replyMsg) {
      console.log(`[机器人回复]:\n${replyMsg.message}`);
    } else {
      console.log("❌ 超时：未收到有效回复。");
    }
    console.log("----------------------------");

  } catch (err) {
    console.error(`❌ 账号 ${index + 1} 执行出错:`, err.message || err);
  } finally {
    await client.disconnect();
    await client.destroy();
  }
}

async function main() {
  // 检查必要环境变量
  if (!API_ID || !API_HASH) {
    console.error("❌ 错误：未设置环境变量 TG_API_ID 或 TG_API_HASH");
    process.exit(1);
  }
  if (!SESSIONS_ENV) {
    console.error("❌ 错误：未设置环境变量 TG_SESSION");
    process.exit(1);
  }

  // 解析 Session 列表 (支持换行符或 & 分隔)
  const sessionList = SESSIONS_ENV.split(/[\n&]/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  console.log(`检测到 ${sessionList.length} 个账号，开始任务...`);
  console.log(`目标机器人: ${BOT_USERNAME}, 命令: ${CHECKIN_COMMAND}`);

  for (let i = 0; i < sessionList.length; i++) {
    await runTask(sessionList[i], i);
    // 账号间稍微暂停，避免触发风控
    if (i < sessionList.length - 1) await sleep(3000); 
  }
  
  console.log("\n所有任务完成。");
  process.exit(0);
}

main();