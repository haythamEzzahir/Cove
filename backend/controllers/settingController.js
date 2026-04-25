import Setting from "../models/setting.js";

const getMySettings = async (req, res) => {
  const settings = await Setting.findOne({ userId: req.user._id });
  res.json(settings);
};

const updateMySettings = async (req, res) => {
  const settings = await Setting.findOne({ userId: req.user._id });

  if (!settings) {
    return res.status(404).json({ message: "Settings not found" });
  }

  settings.theme = req.body.theme ?? settings.theme;
  settings.compactView = req.body.compactView ?? settings.compactView;
  settings.notifications = req.body.notifications ?? settings.notifications;
  settings.language = req.body.language ?? settings.language;

  const updated = await settings.save();

  res.json(updated);
};

export { getMySettings, updateMySettings };