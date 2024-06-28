require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const cors = require("cors");

var corsOptions = {
  origin: "*",
  optionsSuccessStatus: 200,
};

const jwtPassword = process.env.JWT_SECRET;
const PORT = process.env.PORT;

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("mongoDB connected successfully!");
  } catch (err) {
    console.log("could not connect DB " + err);
    process.exit(1);
  }
}
main();

const UserProfile = mongoose.model("Users", {
  name: String,
  username: String,
  password: String,
});

const app = express();
app.use(express.json(), cors(corsOptions));

app.post("/signup", async function (req, res) {
  const { name, username, password } = req.body;

  if (!name || !username || !password) {
    res.status(500).json({
      msg: "Please fill all the required values",
    });
  } else {
    try {
      const existUsername = await UserProfile.findOne({ username: username });
      if (existUsername) {
        res.status(400).json({
          msg: "Username already exist! Please try something different!",
        });
      } else {
        const users = new UserProfile({
          name,
          username,
          password,
        });

        await users.save();
        res.status(200).json({
          msg: "SignUp successfull!",
        });
      }
    } catch (err) {
      res.status(404).json({
        msg: "Something happened while signin please try later/try again!",
      });
    }
  }
});

async function userExists(username, password) {
  try {
    const data = await UserProfile.findOne({ username, password });
    return !!data;
  } catch (err) {
    console.log("error while checking!");
    return false;
  }
}

app.post("/signin", async function (req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({
      msg: "Please Fill all the Deatails!",
    });
  } else {
    try {
      const exists = await userExists(username, password);
      if (!exists) {
        res.status(400).json({
          msg: "Username or Password dosent Exists!",
        });
      } else {
        const token = jwt.sign({ username, username }, jwtPassword, {
          expiresIn: "7h",
        });

        res.json({
          token,
          msg: "You have signIn successfully!",
        });
      }
    } catch (err) {
      res.status(500).json({
        msg: "Something wrong happened while sign in ! Please try later!",
      });
    }
  }
});

app.get("/users", (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      msg: "Authorization header missing or malformed",
    });
  } else {
    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, jwtPassword);
      const username = decoded.username;
      res.json({
        username,
        msg: "Welcome to our website!",
      });
    } catch (err) {
      console.error("Invalid token:", err);
      res.status(401).json({
        msg: "Invalid token",
      });
    }
  }
});

app.use((err, req, res, next) => {
  res.status(500).json({
    msg: "something wrong with the server!",
  });
});

app.listen(PORT, () => {
  console.log(`Your server is running at server ${PORT}`);
});
