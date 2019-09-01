# ChatBotProd
React Chatbot

# System requirements/ node modules:
1. Concurrent -- this helps run two servers parallely
2. Nodemon    -- auto run node scripts or js files, when updated
3. Express
4. Heroku
5. JSON web tokens

# Steps to start the application:
1. Go to root directory where package.json is present
2. Open command prompt from this location and run command -- "npm run dev"; this will fire up two servers one for node server and another for front end
3. Note: Node server is hosted on PORT different from client dev server PORT.
4. In order to be able to call http proxy like "/login", add "proxy" in package.json inside client folder.
