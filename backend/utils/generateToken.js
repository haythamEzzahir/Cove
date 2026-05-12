import jwt from "jsonwebtoken";

const generateToken = (id, expiresIn = "15m") => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn });
};

export default generateToken;
