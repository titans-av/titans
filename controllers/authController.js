const db = require("../dbconfig");
const { isEmail, isEmpty } = require("validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const saltRounds = 10;

const checkEmail = (email) => {
  let valid = true;
  if (isEmpty(email) || !isEmail(email)) {
    valid = false;
  }
  return valid;
};

const handleErrors = (err) => {
  if (err.code === "23505") return "User already exist";
};

const checkUserDetails = (details) => {
  let message = { email: "", name: "", password: "" };
  if (!isEmail(details.email)) {
    if (isEmpty(details.email)) {
      message.email = "Email cannot be empty";
    } else {
      message.email = `${details.email} is not a valid email`;
    }
  }
  if (isEmpty(details.name)) message.name = `Name cannot be empty`;
  if (isEmpty(details.password)) message.password = `Password cannot be empty`;
  return message;
};

const maxAge = 3 * 24 * 60 * 60;
const createToken = (obj) => {
  //returns a token with a signature and headers are automatically applied
  return jwt.sign(obj, "been working since the jump", {
    expiresIn: maxAge,
  });
};
module.exports.signup = (req, res) => {
  const { name, email, password } = req.body;
  console.log("req body", req.body);
  const msg = checkUserDetails({ name, email, password });
  if (msg.name !== "" || msg.email !== "" || msg.password !== "") {
    res.status(400).json({ msg });
  } else {
    bcrypt
      .hash(password, saltRounds)
      .then((hash) => {
        console.log("hash", hash);
        db("users")
          .returning("*")
          .insert({
            email,
            name,
            pwd: hash,
            joined: new Date(),
            accbal: 0,
            phone: 0,
            manual: 0,
            auto: 0,
            real: 0,
            buy: 0,
            sell: 0,
          })
          .then((user) => {
            console.log("user", user);
            const token = createToken({ email, admin: false });
            //httpOnly: we can access it from the console (via js)
            // res.cookie('jwt',token, {httpOnly: true, maxAge: maxAge * 1000})
            res.status(201).json({ email, token });
          })
          .catch((err) => {
            console.log("gvhb", err);
            res.json({ exists: handleErrors(err) });
          }); //db
      })
      .catch(console.log);
  }
};

module.exports.user = async (req, res) => {
  const { email } = req.body;
  const users = await db.select("*").from("users").where({ email });
  const user = { ...users[0], pwd: "" };
  res.json(user);
};

module.exports.login = (req, res) => {
  const { email, password } = req.body;

  const msg = checkUserDetails({ name: "", email, password });
  if (msg.email !== "" || msg.password !== "") {
    res.status(400).json({ msg });
  } else {
    //look for user with email in db

    db.select("*")
      .from("users")
      .where({ email })
      .then(async (user) => {
        if (user.length === 0) {
          res.status(400).json({ error: "Incorrect email or password" });
        } else {
          //compare

          const match = await bcrypt.compare(password, user[0].pwd);
          if (match) {
            const token = createToken({
              email: user[0].email,
              admin: user[0].admin,
            });

            // db.select("*")
            //   .from("users")
            //   .where({ email })
            //   .update({
            //     login: new Date(),
            //   })
            //   .then((res) => console.log(res));
            // res.cookie('jwt',token, {httpOnly: true, maxAge: maxAge * 1000})
            res.status(201).json({ token, email, admin: user[0].admin });
            //create a jwt and send that as response in a cookie
          } else {
            res.status(400).json({ error: "Incorect email or password" });
          }
        }
      })
      .catch((err) => {
        res.status(400).json({ error: "Cannot login at this time" });
      });
  }
};

module.exports.logout = (req, res) => {
  res.cookie("jwt", "", { maxAge: 1 });
  res.json("logout");
};

module.exports.withdraw = async (req, res) => {
  const { email, address, withdrwal } = req.body;
  console.log("body", email, address, withdrwal);
  // const withd = parseInt(withdrwal);
  if (checkEmail(email)) {
    try {
      //returns 1 if done
      const isDone = await db("users")
        .where({ email })
        .update({ address, withdrwal });
      console.log("doneee: ", isDone);
      res.json(isDone);
    } catch (err) {
      res.json({ err: "try again later?" });
    }
  } else {
    res.status(400).json({ err: "invalid email" });
  }
};

module.exports.deposit = async (req, res) => {
  const { email, depos } = req.body;

  if (checkEmail(email)) {
    try {
      //returns 1 if done
      const isDone = await db("users").where({ email }).update({ depos });
      res.json(isDone);
    } catch (err) {
      res.json({ err: "try again later?" });
    }
  } else {
    res.json({ err: "invalid email" });
  }
};

module.exports.buy = async (req, res) => {
  const { email, purchase, type } = req.body;
  console.log("email, pur", email, purchase);

  try {
    //returns 1 if done
    const user = await db("users").where({ email });

    let isDone;
    // const active = parseInt(user[0].active) + parseInt(purchase);
    if (type === "auto") {
      const accbal = parseInt(user[0].accbal) - parseInt(purchase);
      const auto = parseInt(user[0].auto) + parseInt(purchase);
      isDone = await db("users").where({ email }).update({ accbal, auto });
    } else if (type === "manual") {
      const accbal = parseInt(user[0].accbal) - parseInt(purchase);
      const manual = parseInt(user[0].manual) + parseInt(purchase);
      isDone = await db("users").where({ email }).update({ accbal, manual });
    } else if (type === "real") {
      const accbal = parseInt(user[0].accbal) - parseInt(purchase);
      const real = parseInt(user[0].real) + parseInt(purchase);
      isDone = await db("users").where({ email }).update({ accbal, real });
    }

    res.json(isDone);
  } catch (err) {
    res.json({ err });
  }
};

module.exports.add = async (req, res) => {
  const { email, addtype } = req.body;
  let isDone;
  try {
    const user = await db("users").where({ email });
    if (addtype == "buy") {
      const newbuy = parseInt(user[0].buy) + 1;
      isDone = await db("users").where({ email }).update({ buy: newbuy });
    } else if (addtype == "sell") {
      const newsell = parseInt(user[0].sell) + 1;
      isDone = await db("users").where({ email }).update({ sell: newsell });
    }
    res.json(isDone);
  } catch (err) {
    res.status(400).json({ err: "error making transaction" });
  }
};

module.exports.profile = async (req, res) => {
  const { email, name, phone, pwd } = req.body;
  const hash = await bcrypt.hash(pwd, saltRounds);
  console.log("hash: ", hash);

  if (checkEmail(email)) {
    try {
      //returns 1 if done
      const isDone = await db("users")
        .where({ email })
        .update({ name, phone, pwd: hash });
      res.json(isDone);
    } catch (err) {
      res.json({ err });
    }
  } else {
    res.json({ err: "invalid email" });
  }
};

module.exports.execute = async (req, res) => {
  const { email, entry, tp, sl } = req.body;

  try {
    const isDone = await db("users").where({ email }).update({
      entry,
      tp,
      sl,
    });

    res.json(isDone);
  } catch (err) {
    res.json({ err });
  }
};
