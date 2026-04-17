const supabase = require("../utils/supabase");

// ---------- POST /events ----------
exports.createEvent = async (req, res, next) => {
  try {
    const { title, description, datetime, remind_before_minutes, repeat_type } =
      req.body;

    if (!title || !datetime) {
      return res.status(400).json({ error: "title and datetime are required" });
    }

    const validRemind = [5, 15, 30, 60];
    const remind = validRemind.includes(remind_before_minutes)
      ? remind_before_minutes
      : 15;

    const { data, error } = await supabase
      .from("events")
      .insert({
        title,
        description: description || null,
        datetime,
        remind_before_minutes: remind,
        repeat_type: repeat_type || "none",
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
};

// ---------- GET /events ----------
// Query params: ?from=2026-04-01&to=2026-04-30
exports.getEvents = async (req, res, next) => {
  try {
    let query = supabase
      .from("events")
      .select("*")
      .order("datetime", { ascending: true });

    if (req.query.from) {
      query = query.gte("datetime", req.query.from);
    }
    if (req.query.to) {
      query = query.lte("datetime", req.query.to);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json(data);
  } catch (err) {
    next(err);
  }
};

// ---------- PUT /events/:id ----------
exports.updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = {};

    const allowedFields = [
      "title",
      "description",
      "datetime",
      "remind_before_minutes",
      "repeat_type",
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.remind_before_minutes) {
      const validRemind = [5, 15, 30, 60];
      if (!validRemind.includes(updates.remind_before_minutes)) {
        updates.remind_before_minutes = 15;
      }
    }

    // Reset reminded flag when datetime changes
    if (updates.datetime) {
      updates.reminded = false;
    }

    const { data, error } = await supabase
      .from("events")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Event not found" });

    res.json(data);
  } catch (err) {
    next(err);
  }
};

// ---------- DELETE /events/:id ----------
exports.deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("events")
      .delete()
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Event not found" });

    res.json({ message: "Event deleted", id });
  } catch (err) {
    next(err);
  }
};
