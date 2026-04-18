/**
 * LINE Messaging API Module with Telegram Fallback
 *
 * ส่งแจ้งเตือนผ่าน LINE Messaging API (แทน LINE Notify ที่ยกเลิกไปแล้ว)
 * พร้อม fallback ไป Telegram Bot
 *
 * ===== วิธีเตรียม LINE Messaging API =====
 *
 *   1. ไปที่ https://developers.line.biz/
 *   2. Login แล้วสร้าง Provider (ถ้ายังไม่มี)
 *   3. สร้าง Channel → เลือก "Messaging API"
 *   4. ไปที่ tab "Messaging API" → Issue Channel Access Token (long-lived)
 *   5. Copy token มาใช้เป็น channelAccessToken
 *
 *   ** หา User ID / Group ID ได้จาก: **
 *   - User ID: ดูใน "Basic settings" ของ channel (Your user ID)
 *     หรือรับจาก webhook event เมื่อมีคนส่งข้อความหา bot
 *   - Group ID: รับจาก webhook event เมื่อ bot ถูกเชิญเข้ากลุ่ม
 *
 *   ** แผนฟรี: ส่งได้ 500 ข้อความ/เดือน **
 *
 * ===== วิธีเตรียม Telegram Bot (fallback) =====
 *
 *   1. คุยกับ @BotFather บน Telegram → /newbot
 *   2. จะได้ Bot Token มา
 *   3. หา Chat ID โดยส่งข้อความหา bot แล้วเรียก
 *      https://api.telegram.org/bot<TOKEN>/getUpdates
 *
 * ===== ตัวอย่างการใช้งาน =====
 *
 *   const { sendLine, sendNotification, formatMeeting } = require('./line-notify');
 *
 *   // ส่งแค่ LINE
 *   await sendLine('CHANNEL_ACCESS_TOKEN', 'USER_ID', 'สวัสดีครับ');
 *
 *   // ส่ง LINE พร้อม fallback Telegram
 *   await sendNotification({
 *     lineToken: 'CHANNEL_ACCESS_TOKEN',
 *     lineUserId: 'USER_ID',
 *     telegramBotToken: 'TG_BOT_TOKEN',
 *     telegramChatId: 'CHAT_ID',
 *     message: formatMeeting('ประชุมทีม', '14:00', 15),
 *   });
 */

const https = require('https');

// ─── Logging ────────────────────────────────────────────────

function log(level, channel, detail) {
  const timestamp = new Date().toISOString();
  const prefix = { ok: '✅', fail: '❌', info: 'ℹ️' }[level] || '•';
  console.log(`[${timestamp}] ${prefix} [${channel}] ${detail}`);
}

// ─── HTTP helper (ใช้ built-in https, ไม่ต้องติดตั้ง dependency) ──

function postJSON(url, headers, payload) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const options = {
      hostname: parsed.hostname,
      port: 443,
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        ...headers,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ─── LINE Messaging API ─────────────────────────────────────

/**
 * ส่งข้อความผ่าน LINE Messaging API (Push Message)
 * @param {string} channelAccessToken - Channel Access Token จาก LINE Developers Console
 * @param {string} to                 - User ID หรือ Group ID ปลายทาง
 * @param {string} message            - ข้อความที่จะส่ง (สูงสุด 5,000 ตัวอักษร)
 * @returns {Promise<{success: boolean, status: number, body: object}>}
 */
async function sendLine(channelAccessToken, to, message) {
  if (!channelAccessToken) throw new Error('Channel Access Token is required');
  if (!to) throw new Error('User ID or Group ID (to) is required');
  if (!message) throw new Error('Message is required');

  const payload = {
    to,
    messages: [{ type: 'text', text: message }],
  };

  try {
    const res = await postJSON(
      'https://api.line.me/v2/bot/message/push',
      { Authorization: `Bearer ${channelAccessToken}` },
      payload,
    );

    // LINE Messaging API returns 200 with empty body {} on success
    const success = res.status === 200;
    log(
      success ? 'ok' : 'fail',
      'LINE',
      `status=${res.status} body=${JSON.stringify(res.body)}`,
    );
    return { success, status: res.status, body: res.body };
  } catch (err) {
    log('fail', 'LINE', err.message);
    return { success: false, status: 0, body: { message: err.message } };
  }
}

/**
 * ส่งข้อความหลายรายการในครั้งเดียว (สูงสุด 5 ข้อความต่อ request)
 * @param {string} channelAccessToken
 * @param {string} to
 * @param {Array<{type: string, text: string}>} messages - array of message objects
 * @returns {Promise<{success: boolean, status: number, body: object}>}
 */
async function sendLineMulti(channelAccessToken, to, messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('messages must be a non-empty array');
  }
  if (messages.length > 5) {
    throw new Error('LINE allows max 5 messages per request');
  }

  try {
    const res = await postJSON(
      'https://api.line.me/v2/bot/message/push',
      { Authorization: `Bearer ${channelAccessToken}` },
      { to, messages },
    );

    const success = res.status === 200;
    log(success ? 'ok' : 'fail', 'LINE', `multi(${messages.length}) status=${res.status}`);
    return { success, status: res.status, body: res.body };
  } catch (err) {
    log('fail', 'LINE', err.message);
    return { success: false, status: 0, body: { message: err.message } };
  }
}

// ─── Telegram Bot ───────────────────────────────────────────

/**
 * ส่งข้อความผ่าน Telegram Bot (ใช้เป็น fallback)
 * @param {string} botToken - Telegram Bot token
 * @param {string} chatId   - Chat ID ปลายทาง
 * @param {string} message  - ข้อความที่จะส่ง
 * @returns {Promise<{success: boolean, status: number, body: object}>}
 */
async function sendTelegram(botToken, chatId, message) {
  if (!botToken || !chatId) throw new Error('Telegram botToken and chatId are required');

  try {
    const res = await postJSON(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {},
      { chat_id: chatId, text: message, parse_mode: 'HTML' },
    );

    const success = res.status === 200 && res.body?.ok === true;
    log(success ? 'ok' : 'fail', 'Telegram', `status=${res.status} ok=${res.body?.ok}`);
    return { success, status: res.status, body: res.body };
  } catch (err) {
    log('fail', 'Telegram', err.message);
    return { success: false, status: 0, body: { message: err.message } };
  }
}

// ─── Unified send with fallback ─────────────────────────────

/**
 * ส่งแจ้งเตือน LINE ก่อน ถ้าไม่สำเร็จจะ fallback ไป Telegram
 * @param {object} opts
 * @param {string} opts.lineToken          - LINE Channel Access Token
 * @param {string} opts.lineUserId         - User ID / Group ID ปลายทาง
 * @param {string} opts.message            - ข้อความ
 * @param {string} [opts.telegramBotToken] - Telegram Bot token (optional)
 * @param {string} [opts.telegramChatId]   - Telegram chat ID (optional)
 * @returns {Promise<{channel: string, success: boolean, result: object}>}
 */
async function sendNotification({ lineToken, lineUserId, message, telegramBotToken, telegramChatId }) {
  // ลอง LINE ก่อน
  log('info', 'Notify', 'Sending via LINE Messaging API...');
  const lineResult = await sendLine(lineToken, lineUserId, message);

  if (lineResult.success) {
    return { channel: 'line', success: true, result: lineResult };
  }

  // LINE ล้มเหลว → fallback Telegram
  if (telegramBotToken && telegramChatId) {
    log('info', 'Notify', 'LINE failed — falling back to Telegram...');
    const tgResult = await sendTelegram(telegramBotToken, telegramChatId, message);
    return { channel: 'telegram', success: tgResult.success, result: tgResult };
  }

  log('fail', 'Notify', 'LINE failed and no Telegram fallback configured');
  return { channel: 'line', success: false, result: lineResult };
}

// ─── Message formatters ─────────────────────────────────────

/**
 * จัดรูปแบบข้อความแจ้งเตือนประชุม
 */
function formatMeeting(title, time, minutesBefore = 15) {
  return [
    `🔔 แจ้งเตือน: ${title}`,
    `📅 วันนี้ ${time} น.`,
    `⏰ อีก ${minutesBefore} นาทีจะถึงเวลานัด`,
  ].join('\n');
}

/**
 * จัดรูปแบบข้อความแจ้งเตือนทั่วไป
 * @param {'info'|'warning'|'error'|'success'} type
 */
function formatAlert(title, body, type = 'info') {
  const icons = { info: 'ℹ️', warning: '⚠️', error: '🚨', success: '✅' };
  const icon = icons[type] || icons.info;
  return [`${icon} ${title}`, `─────────────`, body].join('\n');
}

/**
 * จัดรูปแบบข้อความแจ้งเตือน deploy/release
 * @param {'success'|'failure'} status
 */
function formatDeploy(project, version, status = 'success') {
  const icon = status === 'success' ? '🚀' : '💥';
  const label = status === 'success' ? 'สำเร็จ' : 'ล้มเหลว';
  return [
    `${icon} Deploy ${label}`,
    `📦 ${project} v${version}`,
    `🕐 ${new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}`,
  ].join('\n');
}

// ─── Exports ────────────────────────────────────────────────

module.exports = {
  sendLine,
  sendLineMulti,
  sendTelegram,
  sendNotification,
  formatMeeting,
  formatAlert,
  formatDeploy,
};
