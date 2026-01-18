/*
[task_local]
#机场签到
0 7 * * * , tag=机场签到, enabled=true
*/
const axios = require('axios');
const path = require('path');
const fs = require('fs');

// 尝试加载 notify，避免崩溃
let notify = { sendNotify: async () => {} };
try {
    // 优先查找当前目录，其次查找 function 目录 (常见的 QL 结构)
    const possiblePaths = [
        './sendNotify', 
        './function/sendNotify', 
        '../sendNotify'
    ];
    
    for (const p of possiblePaths) {
         try {
             require.resolve(p); // 检查文件是否存在
             notify = require(p);
             break;
         } catch(e) {}
    }
} catch (e) {
    console.log('未找到 sendNotify.js，将不发送通知');
}

// 环境变量
const airportCookie = process.env.airportCookie || '';
const DOMAIN = 'glados.rocks';

// 辅助函数：随机睡眠
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function checkIn(cookie, index) {
    const headers = {
        'cookie': cookie,
        'referer': `https://${DOMAIN}/console/checkin`,
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
        'content-type': 'application/json;charset=UTF-8'
    };

    try {
        // 1. 执行签到
        const checkinRes = await axios.post(`https://${DOMAIN}/api/user/checkin`, {
            token: "glados.cloud"
        }, { headers });
        
        const checkinMsg = checkinRes.data.message;
        
        // 2. 查询状态 (可选，获取剩余天数)
        // 注意：部分账号可能获取状态失败，不应阻碍主流程
        let statusMsg = "";
        try {
            const statusRes = await axios.get(`https://${DOMAIN}/api/user/status`, { headers });
            if (statusRes.data && statusRes.data.data) {
                const leftDays = parseInt(statusRes.data.data.leftDays);
                const email = statusRes.data.data.email;
                statusMsg = `[${email}] 剩余 ${leftDays} 天`;
            }
        } catch (statusError) {
            console.log(`账号${index} 获取状态失败: ${statusError.message}`);
        }

        // 3. 查询点数
        let pointsMsg = "";
        try {
            const pointsRes = await axios.get(`https://${DOMAIN}/api/user/points`, { headers });
            // JSON structure: {"code":0,"points":"184.0000","history":[...]}
            if (pointsRes.data && pointsRes.data.points !== undefined) {
                const points = parseInt(pointsRes.data.points);
                pointsMsg = `，点数: ${points}`;
            }
        } catch (pointsError) {
            console.log(`账号${index} 获取点数失败: ${pointsError.message}`);
        }

        const log = `账号${index} ${statusMsg}${pointsMsg}: ${checkinMsg}`;
        console.log(log);
        return log;

    } catch (e) {
        const errMsg = `账号${index} 签到失败: ${e.message}`;
        console.log(errMsg);
        return errMsg;
    }
}

async function main() {
    if (!airportCookie) {
        console.log("请设置环境变量 airportCookie (格式: cookie1@cookie2)");
        return;
    }

    // 检查 axios 是否安装，如果没有提示安装
    try {
        require.resolve('axios');
    } catch (e) {
        console.log("错误: 缺少依赖 'axios'");
        console.log("请在终端运行: npm install axios");
        // 为了兼容性，这里可以考虑 fallback，但既然是优化建议，直接提示安装更好
        return;
    }

    const cookies = airportCookie.split('@').filter(x => x && x !== 'undefined');
    console.log(`共 ${cookies.length} 个账号\n`);

    let allMsg = '';
    
    for (let i = 0; i < cookies.length; i++) {
        if (i > 0) {
            // 随机延时 2-5 秒
            const wait = Math.floor(Math.random() * 3000) + 2000;
            console.log(`等待 ${wait/1000}秒 ...`);
            await sleep(wait);
        }
        const msg = await checkIn(cookies[i], i + 1);
        allMsg += msg + '\n';
    }

    if (allMsg) {
        await notify.sendNotify("机场签到汇总", allMsg);
    }
}

main();
