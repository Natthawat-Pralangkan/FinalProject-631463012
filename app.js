const express = require("express");
const app = express();
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const { v4: uuidv4 } = require("uuid");
// Server configuration
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false })); // <--- middleware configuration
// Connection to the SQlite database
const db_name = path.join(__dirname, "/database", "user.db");
const db = new sqlite3.Database(db_name, (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log("Successful connection to the database 'user.db'");
});
const sql_create = `CREATE TABLE IF NOT EXISTS user (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password VARCHAR(100) NOT NULL
  );`;
db.run(sql_create, (err, row) => {
  if (err) {
    console.error(err.message);
  }
  console.log("สร้างdb สำเร็จ");
});
// Starting the server
app.listen(3000, () => {
  console.log("Server started (http://localhost:3000/) !");
});

app.get("/", (req, res) => {
  res.render("Login");
});
app.get("/register", (req, res) => {
  res.render("register");
});
app.get("/home", (req, res) => {
  res.render("home");
});

app.get("/show", (req, res) => {
  const sql = "SELECT * FROM user ";
  db.all(sql, [], (err, rows) => {
    if (err) {
      return console.error(err.message);
    }
    res.render("show", { model: rows });
  });
});
// GET/edit/5
app.get("/edit/:id", (req, res) => {
  const id = req.params.id;
  const sql = "SELECT * FROM user WHERE ID = ?";
  db.get(sql, id, (err, row) => {
    // if (err) ...
    res.render("edit", { model: row });
  });
});
// POST/edit/5
app.post("/edit/:id", (req, res) => {
  const id = req.params.id;
  const book = [req.body.name, req.body.email, req.body.password, id];
  const sql =
    "UPDATE user SET name = ?, email = ?, password = ? WHERE (ID = ?)";
  db.run(sql, book, (err) => {
    if (err) {
      return console.error(err.message);
    }
    res.redirect("/show");
  });
});

// POST /create
app.post("/register", (req, res) => {
  const sql = "INSERT INTO user (name, email, password) VALUES (?, ?, ?)";
  const book = [req.body.name, req.body.email, req.body.password];
  db.run(sql, book, (err) => {
    // if (err) ...
    res.redirect("/");
  });
});
// GET /delete/5
app.get("/delete/:id", (req, res) => {
  const id = req.params.id;
  const sql = "SELECT * FROM user WHERE ID = ?";
  db.get(sql, id, (err, row) => {
    // if (err) ...
    res.render("delete", { model: row });
  });
});
// POST /delete/5
app.post("/delete/:id", (req, res) => {
  const id = req.params.id;
  const sql = "DELETE FROM user WHERE ID = ?";
  db.run(sql, id, (err) => {
    // if (err) ...
    res.redirect("/show");
  });
});

app.post("/home", (req, res) => {
  const { email, password } = req.body;

  db.get("SELECT * FROM user WHERE email = ?", [email], (err, user) => {
    if (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
      return;
    }

    if (!user || user.password !== password) {
      res.status(401).send("Invalid email or password");
      return;
    }

    res.render("home");
    // res.send(`Welcome, ${user.email}!`);
  });
});
//////webcam/////////
app.get("/room", (req, res) => {
  res.redirect(`/${uuidv4()}`);
});

app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});
// const session = require("express-session");
const console = require("console");
const server = require("http").Server(app);
const { ExpressPeerServer } = require("peer");
app.use(express.urlencoded({ extended: true }));
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});
// Create peerjs server instance and wrap it with http.Server
const peerServer = ExpressPeerServer(server);
app.use("/peerjs", peerServer);

app.use(express.static("public"));

// Handle socket.io events
io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId, userName) => {
    socket.join(roomId);

    setTimeout(() => {
      socket.to(roomId).broadcast.emit("user-connected", userId);
    }, 5000);

    socket.on("message", (message) => {
      io.to(roomId).emit("createMessage", message, userName);
    });
  });
});
server.listen(process.env.PORT || 3030, () => {
  console.log("Server started on port 3030");
});
////////////////////
