import Setting from "../models/setting.js";

const getMySettings = async (req, res) => {
  let settings = await Setting.findOne({ userId: req.user._id });

  if (!settings) {
    settings = await Setting.create({ userId: req.user._id });
  }

  res.json(settings);
};

const updateMySettings = async (req, res) => {
  const settings = await Setting.findOne({ userId: req.user._id });

  if (!settings) {
    return res.status(404).json({ message: "Settings not found" });
  }

  if (typeof req.body.theme === "string" && ["dark", "light", "system"].includes(req.body.theme)) {
    settings.theme = req.body.theme;
  }
  if (typeof req.body.compactView === "boolean") {
    settings.compactView = req.body.compactView;
  }
  if (typeof req.body.notifications === "boolean") {
    settings.notifications = req.body.notifications;
  }

  const updated = await settings.save();

  res.json(updated);
};

export { getMySettings, updateMySettings };
