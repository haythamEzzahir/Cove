const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  const isProduction = process.env.NODE_ENV === "production";

  res.status(statusCode).json({
    message: err.message || "Server Error",
    stack: isProduction ? undefined : err.stack
  });
};

export default errorHandler;
