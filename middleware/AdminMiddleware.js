const jwt = require("jsonwebtoken");

const requireA = (req, res, next) => {
  const { token } = req.body;
  console.log("tokss", token);
  if (token) {
    jwt.verify(token, "been working since the jump", (err, decodedToken) => {
      //   console.log("things", err, decodedToken);
      if (err) {
        //use decodedToks
        console.log(err);
      } else {
        if (decodedToken.admin) {
          next();
        }
      }
    });
  }
};

module.exports = { requireA };
