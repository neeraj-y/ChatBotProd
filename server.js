/*const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const session = require("express-session");
const uuid = require("uuid/v4");

const app = express();
const PORT = process.env.PORT || 8080;

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

app.listen(PORT);*/

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
let jwt = require('jsonwebtoken');
let config = require('./config');
let middleware = require('./middleware');

let users = null;

const checkIfValidUser = (user) => {
  let isValidUser = false, isChatEnabled = false;
  users.every(_user => {
    if (!isValidUser && _user.username === user.username && _user.password === user.password) {
      isValidUser = true;
      isChatEnabled = _user.isChatEnabled;
      return false; // break out of loop if valid user
    }
    return true; // continue
  });
  return { isValidUser, isChatEnabled } ;
};

class HandlerGenerator {
  login (req, res) {
    let username = req.body.username;
    let password = req.body.password;
    users = req.body.users;

    if (username && password) {
      const { isValidUser, isChatEnabled } = checkIfValidUser({username, password});
      if (isValidUser) {
        let token = jwt.sign({username: username},
          config.secret,
          {
            expiresIn: '0.016h' // '24h' = expires in 24 hours
          }
        );
        // return the JWT token for the future API calls
        res.send({
          success: true,
          message: 'Authentication successful!',
          token: token,
          isChatEnabled
        });
      } else {
        res.send({
          success: false,
          message: 'Incorrect username or password',
          isChatEnabled: false
        });
      }
    } else {
      res.send({
        success: false,
        message: 'Authentication failed! Please check the request',
        isChatEnabled: false
      });
    }
  }
  index (req, res) {
    req.err ? res.json({
      success: false,
      message: 'Token expired'
    }) :
    res.json({
      success: true,
      message: 'Index page'
    });
  }
}

// Starting point of the server
function main () {
  let app = express(); // Export app for other routes to use
  let handlers = new HandlerGenerator();
  const port = process.env.PORT || 8080;
  app.use(bodyParser.urlencoded({ // Middleware
    extended: true
  }));
  app.use(bodyParser.json());
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });
  // Routes & Handlers
  app.post('/login', handlers.login);
  app.get('/validateSession', middleware.checkToken, handlers.index);
  app.listen(port, () => console.log(`Server is listening on port: ${port}`));
}

main();
