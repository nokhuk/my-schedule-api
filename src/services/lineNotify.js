const axios = require("axios");

const LINE_NOTIFY_URL = "https://notify-api.line.me/api/notify";

/**
 * Send a message via LINE Notify.
 * Returns { success, response } or { success, error }.
 */
async function sendLineNotify(message) {
  const token = process.env.LINE_NOTIFY_TOKEN;

  if (!token) {
    console.warn("[LINE] No LINE_NOTIFY_TOKEN set — skipping notification");
    return { success: false, error: "No token configured" };
  }

  try {
    const res = await axios.post(
      LINE_NOTIFY_URL,
      new URLSearchParams({ message }),
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    return { success: true, response: res.data };
  } catch (err) {
    console.error("[LINE] Notify failed:", err.response?.data || err.message);
    return {
      success: false,
      error: err.response?.data?.message || err.message,
    };
  }
}

module.exports = { sendLineNotify };
