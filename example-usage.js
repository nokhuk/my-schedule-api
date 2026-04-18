/**
 * ตัวอย่างการใช้งาน LINE Messaging API module
 *
 * ก่อนรัน:
 *   1. สร้าง Messaging API channel ที่ https://developers.line.biz/
 *   2. Issue Channel Access Token (long-lived)
 *   3. หา User ID จาก Basic settings หรือ webhook event
 *   4. ใส่ค่า TOKEN ด้านล่างให้ถูกต้อง
 *   5. รัน: node example-usage.js
 */

const {
  sendLine,
  sendLineMulti,
  sendNotification,
  formatMeeting,
  formatAlert,
  formatDeploy,
} = require('./line-notify');

// ──────────────────────────────────────────
// ใส่ค่าของคุณตรงนี้
// ──────────────────────────────────────────
const LINE_TOKEN   = 'WzSyndoP2qqWc/0uD7g0QyKNRt5kFDBkU6hDu1k2xcXTB6QnS6cwHoqtVdGnPJ2exjt9PCDbkVlaKdBCnvOD6yJ5Em6mQy6dEbVwxME/FF7KST3FqF4z9vY7dfjSKxLlpmA2GOy//vljMToRl83oggdB04t89/1O/w1cDnyilFU=';
const LINE_USER_ID = 'U8abcbff384f71affa289d244a95d855d';
const TG_BOT_TOKEN = 'YOUR_TELEGRAM_BOT_TOKEN';    // optional — จาก @BotFather
const TG_CHAT_ID   = 'YOUR_TELEGRAM_CHAT_ID';      // optional

async function main() {
  // ตัวอย่าง 1: ส่งข้อความธรรมดา
  console.log('--- Example 1: Simple message ---');
  await sendLine(LINE_TOKEN, LINE_USER_ID, '📢 ทดสอบส่งข้อความจาก Node.js');

  // ตัวอย่าง 2: แจ้งเตือนประชุม
  console.log('\n--- Example 2: Meeting reminder ---');
  const meetingMsg = formatMeeting('ประชุมทีม Backend', '14:00', 15);
  await sendLine(LINE_TOKEN, LINE_USER_ID, meetingMsg);

  // ตัวอย่าง 3: แจ้ง alert ทั่วไป
  console.log('\n--- Example 3: General alert ---');
  const alertMsg = formatAlert(
    'Server CPU สูง',
    'CPU usage 92% บน production-web-01\nกรุณาตรวจสอบด่วน',
    'warning',
  );
  await sendLine(LINE_TOKEN, LINE_USER_ID, alertMsg);

  // ตัวอย่าง 4: แจ้งเตือน deploy
  console.log('\n--- Example 4: Deploy notification ---');
  const deployMsg = formatDeploy('my-api', '2.4.1', 'success');
  await sendLine(LINE_TOKEN, LINE_USER_ID, deployMsg);

  // ตัวอย่าง 5: ส่งหลายข้อความในครั้งเดียว (สูงสุด 5)
  console.log('\n--- Example 5: Multiple messages ---');
  await sendLineMulti(LINE_TOKEN, LINE_USER_ID, [
    { type: 'text', text: '📋 รายงานประจำวัน' },
    { type: 'text', text: '✅ ทุกระบบทำงานปกติ' },
  ]);

  // ตัวอย่าง 6: ส่ง LINE พร้อม fallback Telegram
  console.log('\n--- Example 6: LINE + Telegram fallback ---');
  await sendNotification({
    lineToken: LINE_TOKEN,
    lineUserId: LINE_USER_ID,
    telegramBotToken: TG_BOT_TOKEN,
    telegramChatId: TG_CHAT_ID,
    message: formatMeeting('Sprint Review', '16:30', 10),
  });
}

main().catch(console.error);
