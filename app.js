var express = require("express");
var app = new express();
var http = require("http").Server(app);

const path = require("path");
var io = require("socket.io")(http);
const showdown = require("showdown");
const converter = new showdown.Converter();

let broadcaster;
var Log = require("log");
log = new Log("debug");

var port = process.env.PORT || 3080;

app.use(express.static(__dirname + "/public"));

app.get("/", function (req, res) {
  res.redirect("index.html");
});

function onConnection(socket) {
  socket.on("drawing", (data) => socket.broadcast.emit("drawing", data));
}

io.on("connection", onConnection);
//can make this stream audio video
const tech = io.of("/tech");
tech.on("connection", function (socket) {
  socket.on("join", (data) => {
    socket.join(data.room);
    tech.in(data.room).emit("message", "A New User Joined the Live Chat");
  });
  socket.on("message", (data) => {
    tech.in(data.room).emit("message", data.msg);
  });
  io.on("disconnect", () => {
    console.log("user disconnected");
    tech.emit("message", "A User left the Live Chat");
  });
});

http.listen(port, function () {
  console.log("sever is running on ", port);
});

// const io = require("socket.io")(server);
// app.use(express.static(__dirname + "/public"));

io.sockets.on("error", (e) => console.log(e));
io.sockets.on("connection", (socket) => {
  socket.on("broadcaster", () => {
    broadcaster = socket.id;
    socket.broadcast.emit("broadcaster");
  });
  socket.on("watcher", () => {
    socket.to(broadcaster).emit("watcher", socket.id);
  });
  socket.on("offer", (id, message) => {
    socket.to(id).emit("offer", socket.id, message);
  });
  socket.on("answer", (id, message) => {
    socket.to(id).emit("answer", socket.id, message);
  });
  socket.on("candidate", (id, message) => {
    socket.to(id).emit("candidate", socket.id, message);
  });
  socket.on("disconnect", () => {
    socket.to(broadcaster).emit("disconnectPeer", socket.id);
  });
});
// server.listen(port, () => console.log(`Server is running on port ${port}`));

//routes

app.get("/view", (req, res) => {
  res.sendFile(path.join(__dirname, "public/views/show.html"));
});
app.get("/edit", (req, res) => {
  res.sendFile(path.join(__dirname, "public/views/edit.html"));
});
app.get("/app", (req, res) => {
  res.sendFile(path.join(__dirname, "public/views/edit.html"));
});
app.get("/tcha", (req, res) => {
  res.sendFile(path.join(__dirname, "public/views/t'challa.jpg"));
});

//socket events

io.on("connection", (socket) => {
  console.log(`[server.js] ${socket.id} connected`);
  //socket.emit('update slide', `hello ${socket.id}`)
  socket.on("disconnect", () => {
    console.log(`[server.js] ${socket.id} disonnected`);
  });
});

function updateSlide(markdown) {
  io.emit("update slide", converter.makeHtml(markdown));
}

//API SECTION

app.get("/api/updateSlide", (req, res) => {
  console.log(
    `[Server.js] GET request to 'api/updateSlide' =>${JSON.stringify(
      req.query
    )}`
  );

  const { markdown } = req.query;
  if (markdown) {
    updateSlide(markdown);
    res.status(200).send(`Received 'updateSlide' request with: ${html}\n`);
  } else {
    res.status(400).send("Invalid parameters.\n");
  }
});
