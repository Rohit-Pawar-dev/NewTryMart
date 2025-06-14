const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ msg: 'No token, auth denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    res.status(400).json({ msg: 'Token is not valid' });
  }
}

function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Admin only' });
  next();
}

function vendorOnly(req, res, next) {
  if (req.user.role !== 'vendor') return res.status(403).json({ msg: 'Vendor only' });
  next();
}

module.exports = { auth, adminOnly, vendorOnly };
