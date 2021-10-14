// Dependencies
var express = require("express");
var router = express.Router();
const axios = require("axios");
const fs = require("fs");
const multer = require("multer");
const path = require("path");
var FormData = require("form-data");

// Multer Storage Setup
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); //Appending extension
  },
});

var upload = multer({ storage: storage });

/* GET home page. */
router.get("/", function (req, res, next) {
  res.send("Sidevox S.A.");
});

router.get("/webhook", function (req, res, next) {
  // Your verify token. Should be a random string.
  // MD5 del texto CONTACTVOX
  let VERIFY_TOKEN = process.env.VERIFY_TOKEN;

  // Parse the query params
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];

  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
    // Checks the mode and token sent is correct
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      // Responds with the challenge token from the request
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});

// Creates the endpoint for our webhook
router.post("/webhook", (req, res) => {
  let body = req.body;
  let data = {};
  let isAck = "false";

  if (body.object === "page") {

    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach(function (entry) {
      // Gets the message. entry.messaging is an array, but
      // will only ever contain one message, so we get index 0
      let webhook_event = entry.messaging[0];
      let messageType;

      if (!!webhook_event.delivery || !!webhook_event.read) {
        isAck = "true";

        if (!!webhook_event.delivery) {
          data.status = "delivered";
        } else if (!!webhook_event.read) {
          data.status = "viewed";
        } else {
          data.status = "sent";
        }

        data.isAck = isAck;
        data.psid = webhook_event.sender.id;
      } else {
        if (!!webhook_event.message) {


          if(!!webhook_event.message.text) {
            messageType = "text";

            data = {
              psid: webhook_event.sender.id,
              type: messageType,
              message: webhook_event.message.text,
              isAck: isAck,
              status: "sent",
            };
          } else if(!!webhook_event.message.attachments) {
            messageType = webhook_event.message.attachments[0].type;
            let url = webhook_event.message.attachments[0].payload.url

            data = {
              psid: webhook_event.sender.id,
              type: messageType,
              message: url,
              isAck: isAck,
              status: "sent",
            };
          }
        }
      }

      axios
        .post(
          "https://developmentdashboard5.contactvox.com/sidevox/facebookapi/",
          data
        )
        .then((res) => {
          console.log(res);
        })
        .catch((error) => {
          console.error(error);
        });
    });

    // Returns a '200 OK' response to all requests
    res.status(200).send("EVENT_RECEIVED");
  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }
});

// Endpoint to send text message
router.post("/sendTextMessage", async (req, res) => {
  try {
    let pageToken = await axios.get(`${process.env.DASHBOARD}/sidevox/facebookapi/getpagetokenfb`);
    let admin = await axios.get(`${process.env.DASHBOARD}/sidevox/facebookapi/getadminaccid`);
    let response = await axios.get(`https://graph.facebook.com/${admin.data.id}?fields=access_token&access_token=${pageToken.data.pageToken}`);
    const ACCESS_TOKEN = response.data.access_token;
    let recipientId = req.body.recipientId;
    let message = req.body.message;

    response = await axios.post(
      `https://graph.facebook.com/v11.0/me/messages?access_token=${ACCESS_TOKEN}`,
      {
        messaging_type: "RESPONSE",
        recipient: {
          id: recipientId,
        },
        message: {
          text: message,
        },
      }
    );

    res.status(200).json({
      response: response.data,
    });
  } catch (error) {
    console.error(error);

    res.status(400).json({
      response: error,
    });
  }
});

// Endpoint to send image message
router.post("/sendImageMessage", upload.single("image"), async (req, res) => {
  try {
    if(!req.file) {
      return res.status(400).send("El archivo no fue encontrado.")
    }

    let pageToken = await axios.get(`${process.env.DASHBOARD}/sidevox/facebookapi/getpagetokenfb`);
    let admin = await axios.get(`${process.env.DASHBOARD}/sidevox/facebookapi/getadminaccid`);
    let response = await axios.get(`https://graph.facebook.com/${admin.data.id}?fields=access_token&access_token=${pageToken.data.pageToken}`);
    const ACCESS_TOKEN = response.data.access_token;
    const filePath = __dirname + "/../" + req.file.path;
    const recipientId = req.body.recipientId;

    let fileReaderStream = fs.createReadStream(filePath);
    let data = new FormData();
    data.append("recipient", `{"id": "${recipientId}"}`);

    data.append(
      "message",
      '{"attachment":{"type":"image", "payload":{"is_reusable": true}}}'
    );
    data.append("filedata", fileReaderStream);

    let config = {
      method: "post",
      url: `https://graph.facebook.com/v11.0/me/messages?access_token=${ACCESS_TOKEN}`,
      headers: {
        ...data.getHeaders(),
      },
      data: data,
    };

    response = await axios(config);

    // TODO: mejorar por ejemplo que notifique en un log que no se elimino
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(err);
        return;
      }

      //file removed
    });

    res.status(200).json({
      response: response.data,
    });
  } catch (error) {
    console.error(error);

    res.status(400).json({
      response: error,
    });
  }
});

// Endpoint to send audio message
router.post("/sendAudioMessage", upload.single("audio"), async (req, res) => {
  try {
    if(!req.file) {
      return res.status(400).send("El archivo no fue encontrado.")
    }

    let pageToken = await axios.get(`${process.env.DASHBOARD}/sidevox/facebookapi/getpagetokenfb`);
    let admin = await axios.get(`${process.env.DASHBOARD}/sidevox/facebookapi/getadminaccid`);
    let response = await axios.get(`https://graph.facebook.com/${admin.data.id}?fields=access_token&access_token=${pageToken.data.pageToken}`);
    const ACCESS_TOKEN = response.data.access_token;
    const filePath = __dirname + "/../" + req.file.path;
    const recipientId = req.body.recipientId;
    let fileReaderStream = fs.createReadStream(filePath);
    let data = new FormData();
    data.append("recipient", `{"id": "${recipientId}"}`);

    data.append(
      "message",
      '{"attachment":{"type":"audio", "payload":{"is_reusable": true}}}'
    );
    data.append("filedata", fileReaderStream);

    let config = {
      method: "post",
      url: `https://graph.facebook.com/v11.0/me/messages?access_token=${ACCESS_TOKEN}`,
      headers: {
        ...data.getHeaders(),
      },
      data: data,
    };

    response = await axios(config);

    // TODO: mejorar por ejemplo que notifique en un log que no se elimino
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(err);
        return;
      }

      //file removed
    });

    res.status(200).json({
      response: response.data,
    });
  } catch (error) {
    console.error(error);

    res.status(400).json({
      response: error,
    });
  }
});

// Endpoint to send voice note message
router.post("/sendVoiceMessage", upload.single("audio"), async (req, res) => {
  try {
    if(!req.body.audio) {
      return res.status(400).send("El archivo no fue encontrado.")
    }

    let pageToken = await axios.get(`${process.env.DASHBOARD}/sidevox/facebookapi/getpagetokenfb`);
    let admin = await axios.get(`${process.env.DASHBOARD}/sidevox/facebookapi/getadminaccid`);
    let response = await axios.get(`https://graph.facebook.com/${admin.data.id}?fields=access_token&access_token=${pageToken.data.pageToken}`);
    const ACCESS_TOKEN = response.data.access_token;
    const recipientId = req.body.recipientId;
    const base64data = req.body.audio;
    const fileName = new RegExp("[^/]+$").exec(req.body.fileName)[0];
    const filePath = __dirname + "/../" + "uploads/" + fileName + ".wav";

    fs.writeFileSync(
      filePath,
      Buffer.from(base64data.replace("data:audio/wav;base64,", ""), "base64")
    );

    let fileReaderStream = fs.createReadStream(filePath);

    let data = new FormData();
    data.append("recipient", `{"id": "${recipientId}"}`);

    data.append(
      "message",
      '{"attachment":{"type":"audio", "payload":{"is_reusable": true}}}'
    );
    data.append("filedata", fileReaderStream);

    let config = {
      method: "post",
      url: `https://graph.facebook.com/v11.0/me/messages?access_token=${ACCESS_TOKEN}`,
      headers: {
        ...data.getHeaders(),
      },
      data: data,
    };

    response = await axios(config);

    // TODO: mejorar por ejemplo que notifique en un log que no se elimino
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(err);
        return;
      }

      //file removed
    });

    res.status(200).json({
      response: response.data,
    });
  } catch (error) {
    console.error(error);

    res.status(400).json({
      response: error,
    });
  }
});

// Endpoint to send file message
router.post("/sendFileMessage", upload.single("file"), async (req, res) => {
  try {
    if(!req.file) {
      return res.status(400).send("El archivo no fue encontrado.")
    }

    let pageToken = await axios.get(`${process.env.DASHBOARD}/sidevox/facebookapi/getpagetokenfb`);
    let admin = await axios.get(`${process.env.DASHBOARD}/sidevox/facebookapi/getadminaccid`);
    let response = await axios.get(`https://graph.facebook.com/${admin.data.id}?fields=access_token&access_token=${pageToken.data.pageToken}`);
    const ACCESS_TOKEN = response.data.access_token;
    const filePath = __dirname + "/../" + req.file.path;
    const recipientId = req.body.recipientId;
    let fileReaderStream = fs.createReadStream(filePath);
    let data = new FormData();
    data.append("recipient", `{"id": "${recipientId}"}`);

    data.append(
      "message",
      '{"attachment":{"type":"file", "payload":{"is_reusable": true}}}'
    );
    data.append("filedata", fileReaderStream);

    let config = {
      method: "post",
      url: `https://graph.facebook.com/v11.0/me/messages?access_token=${ACCESS_TOKEN}`,
      headers: {
        ...data.getHeaders(),
      },
      data: data,
    };

    response = await axios(config);

    // TODO: mejorar por ejemplo que notifique en un log que no se elimino
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(err);
        return;
      }

      //file removed
    });

    res.status(200).json({
      response: response.data,
    });
  } catch (error) {
    console.error(error);

    res.status(400).json({
      response: error,
    });
  }
});

// Endpoint to send video message
router.post("/sendVideoMessage", upload.single("video"), async (req, res) => {
  try {
    if(!req.file) {
      return res.status(400).send("El archivo no fue encontrado.")
    }

    let pageToken = await axios.get(`${process.env.DASHBOARD}/sidevox/facebookapi/getpagetokenfb`);
    let admin = await axios.get(`${process.env.DASHBOARD}/sidevox/facebookapi/getadminaccid`);
    let response = await axios.get(`https://graph.facebook.com/${admin.data.id}?fields=access_token&access_token=${pageToken.data.pageToken}`);
    const ACCESS_TOKEN = response.data.access_token;
    const filePath = __dirname + "/../" + req.file.path;
    const recipientId = req.body.recipientId;
    let fileReaderStream = fs.createReadStream(filePath);
    let data = new FormData();
    data.append("recipient", `{"id": "${recipientId}"}`);

    data.append(
      "message",
      '{"attachment":{"type":"video", "payload":{"is_reusable": true}}}'
    );
    data.append("filedata", fileReaderStream);

    let config = {
      method: "post",
      url: `https://graph.facebook.com/v11.0/me/messages?access_token=${ACCESS_TOKEN}`,
      headers: {
        ...data.getHeaders(),
      },
      data: data,
    };

    response = await axios(config);

    // TODO: mejorar por ejemplo que notifique en un log que no se elimino
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(err);
        return;
      }

      //file removed
    });

    res.status(200).json({
      response: response.data,
    });
  } catch (error) {
    console.error(error);

    res.status(400).json({
      response: error,
    });
  }
});

module.exports = router;