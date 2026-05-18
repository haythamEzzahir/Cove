import jwt from "jsonwebtoken";

// Generate a signed JWT token with user ID and configurable expiry
const generateToken = (id, expiresIn = "15m") => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn });
};

export default generateToken;
