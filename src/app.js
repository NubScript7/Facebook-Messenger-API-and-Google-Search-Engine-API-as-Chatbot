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

/*
app.get("/kill", (req, res) => {
  res.send("shutting down.");
  process.exit(1);
});
*/
/*
app.get("/testing", (req,res) => {
  res.json({items: [{
    title: "javascript is now in CLI! Introducing nodejs.",
    link: "https://example.com",
    snippet: "A new javascript experience has dropped, introducing nodejs! It uses v8 javascript engine to compile javascript codes, using the JIT or Just-In-Time compilation."
  },
  {
    title: "javascript as nodejs",
    link: "https://example.com/sub2",
    snippet: "javascript now in nodejs! Its using the JIT or Just-In-Time compilation."
  }]})
})
*/
let messagesCount = 0;

const apiKey = process.env.GOOGLE_API_KEY;
const engineId = process.env.GOOGLE_ENGINE_ID;

function createSearchQuery(search) {
  return `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${engineId}&q=${search}`;
}

/*
function createSearchQuery() {
  return `http://localhost:3000/testing`
}
*/

let throwError = false;

function send(id, msg, returnPromise=false) {
  
  //spam prevention feature, when the app somehow breaks
  //and causes it to spam
  //- prevented incidents: 2
  //(increment when app breaks and spams for future devs to see
  
  if (messagesCount >= 50)return throwError = true;
  
  if(throwError){
    throw new Error("Nessage limit exceeded.")
  }
  messagesCount += 1;

  const req = axios.post(
   "https://graph.facebook.com/v2.6/me/messages",
    {
      recipient: {
        id: id
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
  
  if(returnPromise) {
    return req;
  } else {
    req.then(() => console.log("message posted successfully: " + msg))
    .catch(e => {
      console.log("MESSAGE WAS NOT POSTED.")
      console.log("message report error:", e)
    })
  }
}


/*
app.get("/postmsg", (req,res) => {
  const id = req.query.id;
  const msg = req.query.msg;
  if(!id || !msg)return res.sendStatus(400);
  send(id,msg);
  res.sendStatus(200)
})
*/

function translate(char)
{
    let diff;
    if (/[A-Z]/.test(char))
    {
        diff = "𝗔".codePointAt (0) - "A".codePointAt (0);
    }
    else
    {
        diff = "𝗮".codePointAt (0) - "a".codePointAt (0);
    }
    return String.fromCodePoint(char.codePointAt (0) + diff);
}

function translateString(str) {
    if (str.length === 0) {
        return "";
    }
    return str.charAt(0) === " " ? " " : translate(str.charAt(0)) + translateString(str.slice(1));
}


function scrape(msg, id) {
  let currentIndex = 1;
  axios
  .get(createSearchQuery(msg))
  .then(e => {
    e.data.items.forEach((t, i) => {
      const { title, link, snippet } = t;
      send(id,`█ ${translateString(title)}\n\nid: ${currentIndex}\n\n• desc: ${snippet}\n\n• link: ${link}\n\n\n`);
      currentIndex++;
    });
  })
  .catch(err => {
    send(id, "Sorry!, i couldn't process your message, please try again later.")
  });
}



app.post("/webhook", (req, res) => {
  if (req.body.object === "page") {
    for (const entry of req.body.entry) {
      const [user] = entry.messaging;
      console.log(user)
      const senderId = user.sender.id;
      const msg = user.message.text;
      if (!msg)return console.log("message was empty.");
      
      send(id, "fetching data...")
      scrape(msg, senderId);
      
      res.send("EVENT_RECEIVED");
      console.log("sent status code 200 OK")
    }
  } else {
    console.log("sent status code 401 Unauthorized")
    res.sendStatus(401)
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