const { Router } = require("express");
const ctrl = require("../controllers/events");

const router = Router();

router.post("/", ctrl.createEvent);
router.get("/", ctrl.getEvents);
router.put("/:id", ctrl.updateEvent);
router.delete("/:id", ctrl.deleteEvent);

module.exports = router;
