const db = require("../dbconfig");
const { isEmail, isEmpty } = require("validator");
const Knex = require("knex");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const saltRounds = 10;

const checkEmail = (email) => {
  let valid = true;
  if (isEmpty(email) || !isEmail(email)) {
    valid = false;
  }
  return valid;
};

const allUsers = async (req, res) => {
  try {
    const users = await db("users");
    res.json(users.filter((user) => user.email != ""));
  } catch (err) {
    // console.log("errrg", err);
  }
};

const withdrwal = async (req, res) => {
  const users = await db("users");
  res.json(users.filter((user) => user.withdrwal > 0 && user.name != ""));
};

const deposited = async (req, res) => {
  const users = await db("users");
  res.json(
    users.filter((user) => user.depos > 0 && user.name != "ad@test.com")
  );
};

const editUser = async (req, res) => {
  const {
    email,
    accbal,
    name,
    phone,
    pwd,
    manual,
    auto,
    real,
    withdrwal,
    address,
    depos,
    realearn,
    tp,
    sl,
    entry,
  } = req.body;
  const hash = await bcrypt.hash(pwd, saltRounds);
  console.log("hash: ", hash);

  console.log("edit emaila", req.body);

  if (checkEmail(email)) {
    try {
      //returns 1 if done
      if (accbal === "") {
        accbal = 0;
      }
      if (pwd == "") {
        const isDone = await db("users").where({ email }).update({
          email,
          accbal,
          name,
          phone,
          manual,
          auto,
          real,
          withdrwal,
          address,
          depos,
          realearn,
          tp,
          sl,
          entry,
        });
        console.log("hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh");
      } else {
        const isDone = await db("users").where({ email }).update({
          email,
          accbal,
          name,
          phone,
          manual,
          auto,
          real,
          withdrwal,
          address,
          depos,
          pwd: hash,
        });
      }
      res.json(isDone);
    } catch (err) {
      res.json({ err });
    }
  } else {
    res.json({ err: "invalid email" });
  }
};

const del = async (req, res) => {
  const { email } = req.body;
  try {
    //if not the admin delete
    isdeleted = await db("users").where({ email }).del();
    if (isdeleted) {
      res.json({ msg: "success" });
    } else {
      res.json({ msg: "failed" });
    }
  } catch (err) {
    res.json({ msg: "failed" });
  }
};

const address = async (req, res) => {
  const { address } = req.body;
  try {
    const done = await db("users")
      .where({ email: "tests@test.com" })
      .update({ address });
    res.json({ done });
  } catch (err) {
    res.json({ err: "cant change address at this time" });
  }
};

const getAddress = async (req, res) => {
  try {
    const address = (await db("users").where({ email: "tests@test.com" }))[0]
      .address;
    res.json({ address });
  } catch (err) {
    res.json({ err: "cant get address at this time" });
  }
};

module.exports = {
  allUsers,
  editUser,
  del,
  withdrwal,
  address,
  getAddress,
  deposited,
};
