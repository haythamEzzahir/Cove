import Setting, { SUPPORTED_CURRENCIES } from "../models/setting.js";

const SUPPORTED_THEMES = ["dark", "light", "system"];

function serializeSettings(settings) {
  return {
    theme: SUPPORTED_THEMES.includes(settings.theme) ? settings.theme : "dark",
    compactView: Boolean(settings.compactView),
    notifications: settings.notifications !== false,
    currency: SUPPORTED_CURRENCIES.includes(settings.currency) ? settings.currency : "usd"
  };
}

const getMySettings = async (req, res) => {
  let settings = await Setting.findOne({ userId: req.user._id });

  if (!settings) {
    settings = await Setting.create({ userId: req.user._id });
  }

  let shouldSave = false;

  if (!SUPPORTED_THEMES.includes(settings.theme)) {
    settings.theme = "dark";
    shouldSave = true;
  }

  if (!SUPPORTED_CURRENCIES.includes(settings.currency)) {
    settings.currency = "usd";
    shouldSave = true;
  }

  if (shouldSave) {
    await settings.save();
  }

  res.json(serializeSettings(settings));
};

const updateMySettings = async (req, res) => {
  let settings = await Setting.findOne({ userId: req.user._id });

  if (!settings) {
    settings = await Setting.create({ userId: req.user._id });
  }

  if (typeof req.body.theme === "string" && SUPPORTED_THEMES.includes(req.body.theme)) {
    settings.theme = req.body.theme;
  }
  if (typeof req.body.compactView === "boolean") {
    settings.compactView = req.body.compactView;
  }
  if (typeof req.body.notifications === "boolean") {
    settings.notifications = req.body.notifications;
  }
  if (typeof req.body.currency === "string" && SUPPORTED_CURRENCIES.includes(req.body.currency)) {
    settings.currency = req.body.currency;
  }

  const updated = await settings.save();

  res.json(serializeSettings(updated));
};

export { getMySettings, updateMySettings };
