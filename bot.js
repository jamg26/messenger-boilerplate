//
// This is main file containing code implementing the Express server and functionality for the Express echo bot.
//
"use strict";
const express = require("express");
const bodyParser = require("body-parser");
const request = require("request");
const path = require("path");
const callSendAPI = require("./functions/message/call_send_api");
const sendTextMessage = require("./functions/message/send_text");
const sendGenericMessage = require("./functions/message/send_generic");

const textHandler = require("./listeners/text");

var messengerButton =
  '<html><head><title>Facebook Messenger Bot</title></head><body><h1>Facebook Messenger Bot</h1>This is a bot based on Messenger Platform QuickStart. For more details, see their <a href="https://developers.facebook.com/docs/messenger-platform/guides/quick-start">docs</a>.<script src="https://button.glitch.me/button.js" data-style="glitch"></script><div class="glitchButton" style="position:fixed;top:20px;right:20px;"></div></body></html>';

// The rest of the code implements the routes for our Express server.
let app = express();

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);

// Webhook validation
app.get("/webhook", function(req, res) {
  if (
    req.query["hub.mode"] === "subscribe" &&
    req.query["hub.verify_token"] === process.env.VERIFY_TOKEN
  ) {
    console.log("Validating webhook");
    res.status(200).send(req.query["hub.challenge"]);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);
  }
});

// Display the web page
app.get("/", function(req, res) {
  res.writeHead(200, { "Content-Type": "text/html" });
  res.write(messengerButton);
  res.end();
});

// Message processing
app.post("/webhook", function(req, res) {
  //console.log(req.body);
  var data = req.body;

  // Make sure this is a page subscription
  if (data.object === "page") {
    // Iterate over each entry - there may be multiple if batched
    data.entry.forEach(function(entry) {
      var pageID = entry.id;
      var timeOfEvent = entry.time;

      // Iterate over each messaging event
      entry.messaging.forEach(function(event) {
        if (event.message) {
          receivedMessage(event);
        } else if (event.postback) {
          receivedPostback(event);
        } else {
          console.log("Webhook received unknown event: ", event);
        }
      });
    });

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know
    // you've successfully received the callback. Otherwise, the request
    // will time out and we will keep trying to resend.
    res.sendStatus(200);
  }
});

// Incoming events handling
function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  // console.log(
  //   "Received message for user %d and page %d at %d with message:",
  //   senderID,
  //   recipientID,
  //   timeOfMessage
  // );
  // console.log(JSON.stringify(message));

  var messageId = message.mid;

  var messageText = message.text;
  var messageAttachments = message.attachments;

  if (messageText) {
    textHandler(senderID, messageText);
  } else if (messageAttachments) {
    sendTextMessage(senderID, "Message with attachment received");
  }
}

function receivedPostback(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfPostback = event.timestamp;

  // The 'payload' param is a developer-defined field which is set in a postback
  // button for Structured Messages.
  var payload = event.postback.payload;

  // console.log(
  //   "Received postback for user %d and page %d with payload '%s' " + "at %d",
  //   senderID,
  //   recipientID,
  //   payload,
  //   timeOfPostback
  // );

  // When a postback is called, we'll send a message back to the sender to
  // let them know it was successful
  sendTextMessage(senderID, "Postback called");
}

// Set Express to listen out for HTTP requests
var server = app.listen(process.env.PORT || 3000, function() {
  console.log("Listening on port %s", server.address().port);
});
