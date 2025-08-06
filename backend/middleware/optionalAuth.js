const jwt = require("jsonwebtoken");
const optionalAuth = (req, res, next) => {
  const authHeader = req.header("Authorization");
  //   console.log("Authorization header received:", authHeader);
  const token = authHeader?.split(" ")[1];
  //   console.log("Extracted token:", token);
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (err) {
      console.log("JWT verify error:", err.message);
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
};

module.exports = optionalAuth;
