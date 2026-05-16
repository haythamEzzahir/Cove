import Setting, { SUPPORTED_CURRENCIES } from "../models/setting.js";

const SUPPORTED_THEMES = ["dark", "light", "system"];

const getMySettings = async (req, res) => {
  // Find the settings document for the connected user.
  let settings = await Setting.findOne({ userId: req.user._id });

  // New users may not have settings yet, so create the default document.
  if (!settings) {
    settings = await Setting.create({ userId: req.user._id });
  }

  // Older documents may miss new fields added later.
  let changed = false;

  if (!SUPPORTED_THEMES.includes(settings.theme)) {
    settings.theme = "dark";
    changed = true;
  }

  if (typeof settings.compactView !== "boolean") {
    settings.compactView = false;
    changed = true;
  }

  if (typeof settings.notifications !== "boolean") {
    settings.notifications = true;
    changed = true;
  }

  if (!SUPPORTED_CURRENCIES.includes(settings.currency)) {
    settings.currency = "usd";
    changed = true;
  }

  if (changed) {
    await settings.save();
  }

  res.json(settings);
};

const updateMySettings = async (req, res) => {
  let settings = await Setting.findOne({ userId: req.user._id });

  if (!settings) {
    settings = await Setting.create({ userId: req.user._id });
  }

  // Only update fields that were sent in req.body.
  if (SUPPORTED_THEMES.includes(req.body.theme)) {
    settings.theme = req.body.theme;
  }

  if (typeof req.body.compactView === "boolean") {
    settings.compactView = req.body.compactView;
  }

  if (typeof req.body.notifications === "boolean") {
    settings.notifications = req.body.notifications;
  }

  if (SUPPORTED_CURRENCIES.includes(req.body.currency)) {
    settings.currency = req.body.currency;
  }

  const updatedSettings = await settings.save();
  res.json(updatedSettings);
};

export { getMySettings, updateMySettings };
