const getMe = async (req, res) => {
  res.json(req.user);
};

export { getMe };