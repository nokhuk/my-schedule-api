const dayjs = require("dayjs");

/**
 * Calculate the next occurrence for a repeating event.
 * Returns a new ISO datetime string, or null if repeat_type is 'none'.
 */
function getNextOccurrence(datetime, repeatType) {
  const d = dayjs(datetime);

  switch (repeatType) {
    case "daily":
      return d.add(1, "day").toISOString();
    case "weekly":
      return d.add(1, "week").toISOString();
    case "monthly":
      return d.add(1, "month").toISOString();
    default:
      return null;
  }
}

module.exports = { getNextOccurrence };
