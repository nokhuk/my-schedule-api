const cron = require("node-cron");
const dayjs = require("dayjs");
const supabase = require("../utils/supabase");
const { sendLineNotify } = require("./lineNotify");
const { getNextOccurrence } = require("../utils/repeat");

/**
 * Runs every minute.
 * Finds events whose (datetime - remind_before_minutes) <= now
 * and that haven't been reminded yet.
 */
async function checkReminders() {
  const now = dayjs();

  // Fetch un-reminded events whose remind time has arrived
  const { data: events, error } = await supabase
    .from("events")
    .select("*")
    .eq("reminded", false)
    .lte("datetime", now.add(60, "minute").toISOString()); // broad window

  if (error) {
    console.error("[Cron] Query error:", error.message);
    return;
  }

  for (const event of events) {
    const eventTime = dayjs(event.datetime);
    const remindAt = eventTime.subtract(event.remind_before_minutes, "minute");

    // Is it time to remind?
    if (now.isAfter(remindAt) || now.isSame(remindAt, "minute")) {
      const timeStr = eventTime.format("DD/MM/YYYY HH:mm");
      const message = [
        `\n--- Reminder ---`,
        `Title: ${event.title}`,
        event.description ? `Detail: ${event.description}` : null,
        `When: ${timeStr}`,
        `(${event.remind_before_minutes} min before)`,
        event.repeat_type !== "none"
          ? `Repeats: ${event.repeat_type}`
          : null,
      ]
        .filter(Boolean)
        .join("\n");

      const result = await sendLineNotify(message);

      // Log the notification
      await supabase.from("reminder_logs").insert({
        event_id: event.id,
        status: result.success ? "sent" : "failed",
        response_text: JSON.stringify(result),
      });

      // Mark as reminded
      await supabase
        .from("events")
        .update({ reminded: true })
        .eq("id", event.id);

      // If repeating, create next occurrence
      if (event.repeat_type !== "none") {
        const nextDatetime = getNextOccurrence(
          event.datetime,
          event.repeat_type
        );

        if (nextDatetime) {
          await supabase.from("events").insert({
            title: event.title,
            description: event.description,
            datetime: nextDatetime,
            remind_before_minutes: event.remind_before_minutes,
            repeat_type: event.repeat_type,
            reminded: false,
          });

          console.log(
            `[Cron] Created next ${event.repeat_type} occurrence for "${event.title}" at ${nextDatetime}`
          );
        }
      }

      console.log(
        `[Cron] Reminded: "${event.title}" — ${result.success ? "sent" : "failed"}`
      );
    }
  }
}

function startReminderCron() {
  // Run every minute
  cron.schedule("* * * * *", async () => {
    console.log(`[Cron] Checking reminders at ${dayjs().format("HH:mm:ss")}`);
    await checkReminders();
  });

  console.log("[Cron] Reminder service started (every 1 minute)");
}

module.exports = { startReminderCron };
