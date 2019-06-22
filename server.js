const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const session = require("express-session");
const uuid = require("uuid/v4");

const app = express();
const PORT = process.env.PORT || 8080;

// server static files from the React app
app.use(express.static(path.join(__dirname, "client/build")));

app.use(session({
  secret: uuid(),
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 1000 * 60 * 1  // 1000 * 60 * desired minutes
  }
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname + "/client/build/index.html"));
});

app.post('/api/df_text_query', (req, res) => {
  if(req.session.page_views) {
      req.session.page_views++;
   } else {
      req.session.page_views = 1;
   }
   res.send({
     visits: req.session.page_views
   });
});

app.listen(PORT);
