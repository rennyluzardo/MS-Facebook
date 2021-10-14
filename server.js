const express = require("express");
const cors = require("cors");
const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

const app = express();

if(process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

app.use(cors());
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
    limit: "2mb",
    parameterLimit: 500000000,
  })
);
app.use(require("./routes/index.js"));
app.use(express.static(__dirname + "/public"));

// start server
// const port = process.env.NODE_ENV === 'production' ? 80 : 4000;
const PORT = 4005;

https
  .createServer(
    {
      key: fs.readFileSync("my_cert.key"),
      cert: fs.readFileSync("my_cert_chain.crt"),
    },
    app
  )
  .listen(PORT, function () {
    console.log("My HTTPS server listening on port " + PORT + "...");
  });

http.createServer(app).listen(4001);
