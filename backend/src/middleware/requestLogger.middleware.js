const requestLogger = (req, res, next) => {
  const startTime = process.hrtime.bigint();

  // Capture these before Express processes mounted routers.
  const method = req.method;
  const url = req.originalUrl;

  res.on("finish", () => {
    const endTime = process.hrtime.bigint();

    const durationMs = Number(endTime - startTime) / 1_000_000;

    console.log(
      `[API] ${method} ${url} ${res.statusCode} ${durationMs.toFixed(2)}ms`,
    );
  });

  next();
};

export default requestLogger;
