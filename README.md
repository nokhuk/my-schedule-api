# My Schedule API

REST API สำหรับจัดการตารางชีวิตส่วนตัว พร้อมระบบแจ้งเตือนผ่าน LINE Notify

## Features

- **CRUD Events** — สร้าง / ดู / แก้ไข / ลบ นัดหมาย
- **Date Range Filter** — ดึง events ตามช่วงวันที่
- **Repeat Events** — รองรับ daily, weekly, monthly (สร้าง occurrence ถัดไปอัตโนมัติ)
- **LINE Notify Reminders** — cron ตรวจทุก 1 นาที แจ้งเตือนล่วงหน้า 5 / 15 / 30 / 60 นาที
- **Supabase (PostgreSQL)** — เก็บข้อมูลบน cloud database
- **Deploy Ready** — พร้อม deploy บน Railway / Render (free tier)

## Tech Stack

- Node.js + Express
- Supabase (PostgreSQL)
- node-cron
- LINE Notify API
- dayjs

## Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/nokhuk/my-schedule-api.git
cd my-schedule-api
npm install
```

### 2. Setup Supabase

1. สร้างโปรเจกต์ที่ [supabase.com](https://supabase.com)
2. ไปที่ SQL Editor แล้วรัน `sql/schema.sql` เพื่อสร้างตาราง

### 3. Setup LINE Notify

1. ไปที่ [notify-bot.line.me/my](https://notify-bot.line.me/my/)
2. Generate Token เลือกห้องแชทที่ต้องการรับแจ้งเตือน

### 4. Environment Variables

```bash
cp .env.example .env
```

แก้ไข `.env`:

```
PORT=3000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
LINE_NOTIFY_TOKEN=your-line-token
```

### 5. Run

```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

## API Endpoints

### Create Event

```
POST /events
Content-Type: application/json

{
  "title": "ประชุมทีม",
  "description": "ประชุม standup ทุกเช้า",
  "datetime": "2026-04-18T09:00:00+07:00",
  "remind_before_minutes": 15,
  "repeat_type": "daily"
}
```

### Get Events (with date range filter)

```
GET /events?from=2026-04-01&to=2026-04-30
```

### Update Event

```
PUT /events/:id
Content-Type: application/json

{
  "title": "ประชุมทีม (updated)",
  "remind_before_minutes": 30
}
```

### Delete Event

```
DELETE /events/:id
```

## Deploy on Railway / Render

1. Push repo นี้ขึ้น GitHub
2. เชื่อมต่อ repo กับ [Railway](https://railway.app) หรือ [Render](https://render.com)
3. ตั้ง Environment Variables ตาม `.env.example`
4. Start Command: `npm start`

## License

MIT
