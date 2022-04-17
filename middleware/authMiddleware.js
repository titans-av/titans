const jwt = require("jsonwebtoken");

const requireAuth = (req, res) => {
  const { token } = req.body;
  if (token) {
    jwt.verify(token, "been working since the jump", (err, decodedToken) => {
      if (err) {
        res.json({ isUser: false });
      } else {
        res.json({ isUser: true });
      }
    });
  } else {
    res.json({ isUser: false });
  }
};

module.exports = { requireAuth };
