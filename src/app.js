const express = require('express');
const asyncRouter = require("express-promise-router")();
const axios = require("axios");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());
app.use(asyncRouter);

/* safety first! */
app.get("/kill", (req,res) => {
  res.send("shutting down.")
  process.exit(1)
})

asyncRouter.post("/webhook", async (req,res) => {
  
})

app.get("/webhook", (req, res) => {
  let verifyToken = process.env.FB_PAGE_ACCESS_TOKEN;
// Parse the query params
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];

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
  console.log("app is healthy and running!")
})
