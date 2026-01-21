/*
[task_local]
# ListenHub 签到
0 8 * * * , tag=ListenHub签到, enabled=true
*/
const axios = require('axios');
const path = require('path');

// 尝试加载 notify，避免崩溃
let notify = { sendNotify: async () => {} };
try {
    const possiblePaths = [
        './sendNotify', 
        './function/sendNotify', 
        '../sendNotify'
    ];
    for (const p of possiblePaths) {
         try {
             require.resolve(p);
             notify = require(p);
             break;
         } catch(e) {}
    }
} catch (e) {
    console.log('未找到 sendNotify.js，将不发送通知');
}

// 从环境变量读取配置 (必需)
const EnvConfig = {
    auth: process.env.LISTENHUB_AUTH,
    cookie: process.env.LISTENHUB_COOKIE,
    clientId: process.env.LISTENHUB_CLIENT_ID
};

async function checkIn() {
    // 检查环境变量
    if (!EnvConfig.auth || !EnvConfig.cookie || !EnvConfig.clientId) {
        console.error("错误: 缺少必要的环境变量。");
        console.error("请设置以下环境变量:");
        console.error("- LISTENHUB_AUTH");
        console.error("- LISTENHUB_COOKIE");
        console.error("- LISTENHUB_CLIENT_ID");
        return;
    }

    console.log('开始 ListenHub 签到...');

    const url = "https://listenhub.ai/api/listenhub/v1/checkin";
    
    const headers = {
        "authorization": EnvConfig.auth,
        "content-type": "application/json",
        "x-listenhub-client-id": EnvConfig.clientId,
        "cookie": EnvConfig.cookie,
        "Referer": "https://listenhub.ai/zh/app/home",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    };

    const data = {
        "platform": "listenhub"
    };

    try {
        const response = await axios.post(url, data, { headers });
        console.log('签到响应:', response.status, response.statusText);
        console.log('响应数据:', JSON.stringify(response.data, null, 2));

        let msg = `ListenHub 签到成功\n状态码: ${response.status}`;
        if (response.data) {
             // 尝试提取更具体的签到结果信息，假设返回中有 message 或 points
             // 如果知道具体返回结构，可以在这里优化
             msg += `\n返回信息: ${JSON.stringify(response.data)}`;
        }

        await notify.sendNotify("ListenHub 签到", msg);

    } catch (error) {
        console.error('签到失败');
        let errorMsg = "";
        if (error.response) {
            console.error('状态码:', error.response.status);
            console.error('数据:', error.response.data);
            errorMsg = `状态码: ${error.response.status}\n数据: ${JSON.stringify(error.response.data)}`;
        } else {
            console.error('错误信息:', error.message);
            errorMsg = `错误信息: ${error.message}`;
        }
        await notify.sendNotify("ListenHub 签到失败", errorMsg);
    }
}

// 检查 axios 是否安装
try {
    require.resolve('axios');
    checkIn();
} catch (e) {
    console.log("错误: 缺少依赖 'axios'");
    console.log("请在终端运行: npm install axios");
}
