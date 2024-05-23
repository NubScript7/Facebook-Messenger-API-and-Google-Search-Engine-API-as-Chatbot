/*
  Facebook-Messenger-API-and-Google-Search-Engine-API-as-Chatbot

  using google's search engine api to locate
  relative search prompt items and extract
  information from the site and facebook
  messenger chatbot api to serve the results
*/

const {app} = require("./src/app");

app.listen(process.env.PORT || 3000, () => {
	console.log("app is healthy and running!");
});