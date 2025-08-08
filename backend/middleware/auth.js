const jwt = require("jsonwebtoken");
function auth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ msg: "Unauthorized: No token provided" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    res.status(401).json({ msg: "Token is expired or invalid" });
  }
}
function adminOnly(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ msg: "Access denied: Admins only" });
  }
  next();
}
function sellerOnly(req, res, next) {
  if (req.user.role !== "seller") {
    return res.status(403).json({ msg: "Access denied: Sellers only" });
  }
  next();
}
module.exports = { auth, adminOnly, sellerOnly };

