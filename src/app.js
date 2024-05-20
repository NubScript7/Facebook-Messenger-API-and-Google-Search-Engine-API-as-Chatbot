"use strict"

const express = require("express");
const asyncRouter = require("express-promise-router")();
const axios = require("axios");
const cors = require("cors");
//const prompt = require("prompt-sync")();
const app = express();

if(process.argv.some(e => e === "--dev-mode")) {
  console.warn("WARNING: starting server in dev mode.")
  process.env.fb_url = "http://localhost:6700/webhook"
}

app.use(cors());
app.use(express.json());
app.use(asyncRouter);

/* safety first! */
app.get("/kill", (req, res) => {
  res.send("shutting down.");
  process.exit(1);
});

let messagesCount = 0;

const apiKey = process.env.GOOGLE_API_KEY;
const engineId = process.env.GOOGLE_ENGINE_ID;

function createSearchQuery(search) {
  return `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${engineId}&q=${search}`;
}

function send(senderPsid, msg) {
  /*
  spam prevention feature, when the app somehow breaks
  and causes it to spam
  - prevented incidents: 2
  (increment when app breaks and spams for future devs to see
  */
  if (messagesCount >= 50) return;
  messagesCount += 1;

  console.log("posting message: " + msg);
  axios.post(
   "https://graph.facebook.com/v2.6/me/messages",
    {
      recipient: {
        id: senderPsid
      },
      message: {
        text: msg || "INTERNAL: response was empty."
      }
    },
    {
      params: {
        access_token: process.env.FB_PAGE_ACCESS_TOKEN
      }
    }
  )
  .then(() => console.log("message posted successfully: " + msg))
  .catch(e => {
    console.log("message was not posted successfully: " + msg)
    console.log(e)
  })
}

app.post("/webhook", (req, res) => {
  if (req.body.object === "page") {
    for (const entry of req.body.entry) {
      res.send("EVENT_RECEIVED");
      const [user] = entry.messaging;
      const senderId = user.sender.id;
      const msg = user.message?.text;
      if (!msg) return;

      new Promise((resolve, reject) => {
        axios
          .get(createSearchQuery(msg))
          .then((e) => {
            let str = "";
            e.data.items.forEach((t, i) => {
              const { title, link, snippet } = t;
              str += `${i + 1}title: ${title}\n\nlink: ${link}\n\ndesc: ${snippet}\n\n\n`;
            });
            return resolve(str);
          })
          .catch((err) => reject(err));
      })
      .then((e) => {
        console.log("successful retrieved data: "+e)
        send(senderId, e)
        
        })
      .catch(err => {
        console.log("error",err)
        send(senderId, "Sorry!, i couldn't process your message, please try again later.")
      });
    }
  }
});

app.get("/webhook", (req, res) => {
  const verifyToken = process.env.FB_PAGE_VERIFY_TOKEN;
  // Parse the query params
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  // Check if a token and mode is in the query string of the request
  if (mode && token) {
    // Check the mode and token sent is correct
    if (mode === "subscribe" && token === verifyToken) {
      // Respond with the challenge token from the request
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      // Respond with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(403);
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("app is healthy and running!");
});

/* //jest testing
module.exports = {
  send
}
*/