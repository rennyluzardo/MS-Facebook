var express = require('express');
var router = express.Router();
const http = require('http');
const https = require('https');
const axios = require('axios')

const APP_TOKEN = 'EAAOadxaAA7ABACa631ig0XyqRxiilCZBycCW8n5LiSGObdJFsZCXmk2OQZAUaZC7ZA5QljnEssdPRtVZBvgX6qZCWHZCpGyXZAqi9HdsGAGJgFyddoeJ75Wu9rsQu5nTiCHhfoSkZAckRi1ZC1Svxbve60nAjZA3ZAQeZCH6rG5TZBi8vZCGANg95BFHLtDkjitCpZAqEewYZD'
const API_GET_PAGE_ACCESS_TOKEN = `https://graph.facebook.com/439124496444586?fields=access_token&access_token=${APP_TOKEN}`

const USER_ID = 850120342279140
const LONG_LIVE_PAGE_ACCESS_TOKEN = 'EAAOadxaAA7ABABP0S2BTQgy3R15N3py3PXYeVl5MyHWGMcfZBQFDHpcWlvRpbpLgu9RzEgZCf3lLgyI4s6n4ZAqHZB3ZAwCFL3fFtSmqA5ZBUQmwhbhRxjeNBYf4hxsWF9HUUb3c7RmdQMhMOShOM3zlSoc6AE2ozSKZBjpqePDURSfrgZCXehPw'

/* GET home page. */
router.get('/', function(req, res, next) {
  res.send("CUALQUIER COSA");
});

router.get('/webhook', function(req, res, next) {
  // Your verify token. Should be a random string.
  let VERIFY_TOKEN = "rennyLuzardo"

  // Parse the query params
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
    
  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
  
    // Checks the mode and token sent is correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      
      // Responds with the challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);      
    }
  }
});

// Creates the endpoint for our webhook 
router.post('/webhook', (req, res) => {

  // console.log('OK OK OK OK');
  // res.status(200).send('EVENT_RECEIVED');

  let body = req.body;

  if (body.object === 'page') {

    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach(function(entry) {

      // Gets the message. entry.messaging is an array, but 
      // will only ever contain one message, so we get index 0
      console.log('Enviando response a dashboard....');
      let webhook_event = entry.messaging[0];
      axios
      .post('https://developmentdashboard5.contactvox.com/sidevox/facebookapi/', {
        psid: webhook_event.sender.id
      })
      .then(res => {
        console.log(`statusCode: ${res.status}`)
        console.log(res)
      })
      .catch(error => {
        console.error(error)
      })
    });

    // Returns a '200 OK' response to all requests
    res.status(200).send('EVENT_RECEIVED');
  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }
});

// router.post('/webhook', (req, res) => {
//   let body = req.body;

//   if (body.object === 'page') {

//     // Iterates over each entry - there may be multiple if batched
//     body.entry.forEach(function(entry) {

//       // Gets the message. entry.messaging is an array, but 
//       // will only ever contain one message, so we get index 0
//       let webhook_event = entry.messaging[0];

//       axios
//       .post('https://developmentdashboard5.contactvox.com/sidevox/facebookapi/index', {
//         psid: webhook_event.sender.id
//       })
//       .then(res => {
//         console.log(`statusCode: ${res.status}`)
//         console.log(res)
//       })
//       .catch(error => {
//         console.error(error)
//       })
//     });

//     // Returns a '200 OK' response to all requests
//     res.status(200).send('EVENT_RECEIVED');
//   } else {
//     // Returns a '404 Not Found' if event is not from a page subscription
//     res.sendStatus(404);
//   }
// });

router.post('/sendTextMessage', async (req, res) => {
  try {
    let response = await axios.get(API_GET_PAGE_ACCESS_TOKEN)
    const ACCESS_TOKEN = response.data.access_token

    response = await axios.post(`https://graph.facebook.com/v11.0/me/messages?access_token=${ACCESS_TOKEN}`, {
      messaging_type: "RESPONSE",
      recipient: {
          id: 4674423939276827
      },
      message: {
          text: "Prueba desde Dashboard!"
      }
    })

    res.status(200).json({
      response: response.data
    })
  } catch (error) {
    console.error(error)

    res.status(400).json({
      response: error
    })
  }
});

router.post('/sendImageMessage', async (req, res) => {
  try {
    let response = await axios.get(API_GET_PAGE_ACCESS_TOKEN)
    const ACCESS_TOKEN = response.data.access_token

    response = await axios.post(`https://graph.facebook.com/v11.0/me/messages?access_token=${ACCESS_TOKEN}`, {
      messaging_type: "RESPONSE",
      recipient: {
          id: 4674423939276827
      },
      message: {
          text: "Prueba desde Dashboard!"
      }
    })

    res.status(200).json({
      response: response.data
    })
  } catch (error) {
    console.error(error)

    res.status(400).json({
      response: error
    })
  }
});

router.post('/sendAudioMessage', async (req, res) => {
  try {
    let response = await axios.get(API_GET_PAGE_ACCESS_TOKEN)
    const ACCESS_TOKEN = response.data.access_token

    response = await axios.post(`https://graph.facebook.com/v11.0/me/messages?access_token=${ACCESS_TOKEN}`, {
      messaging_type: "RESPONSE",
      recipient: {
          id: 4674423939276827
      },
      message: {
          text: "Ok Ok Ok"
      }
    })
    
      // console.log(`statusCode: ${resp.status}`)
      // console.log(resp)

    res.status(200).json({
      response: response.data
    })


  } catch (error) {
      
    console.error(error)

    res.status(400).json({
      response: error
    })
  }
});

router.post('/sendFileMessage', async (req, res) => {
  try {
    let response = await axios.get(API_GET_PAGE_ACCESS_TOKEN)
    const ACCESS_TOKEN = response.data.access_token

    response = await axios.post(`https://graph.facebook.com/v11.0/me/messages?access_token=${ACCESS_TOKEN}`, {
      messaging_type: "RESPONSE",
      recipient: {
          id: 4674423939276827
      },
      message: {
          text: "Ok Ok Ok"
      }
    })
    
      // console.log(`statusCode: ${resp.status}`)
      // console.log(resp)

    res.status(200).json({
      response: response.data
    })


  } catch (error) {
      
    console.error(error)

    res.status(400).json({
      response: error
    })
  }});

router.post('/oauth/access_token', (req, res) => {
  let body = req.body;

  console.log(body);
});

router.get('/oauth/access_token', (req, res) => {
  let body = req.body;

  console.log(body);
});

module.exports = router;
