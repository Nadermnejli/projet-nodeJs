require('dotenv').config();
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const methodOverride = require("method-override");
const connectDB = require('./server/config/db');
const session = require('express-session');
const passport = require('passport');
const MongoStore = require('connect-mongo');
const http = require('http'); // Import http module
const socketIo = require('socket.io'); // Import socket.io module

const reminderJob = require('./server/cronJobs/reminderJob');

const app = express();
const server = http.createServer(app); // Create an HTTP server from Express
const io = socketIo(server); // Initialize socket.io with the server

const port = 5000 || process.env.PORT;

// Expose io globally
global.io = io;

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI
  }),
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
connectDB();

// Static Files
app.use(express.static('public'));

// Templating Engine
app.use(expressLayouts);
app.set('layout', './layouts/main');
app.set('view engine', 'ejs');

// Routes
app.use('/', require('./server/routes/auth'));
app.use('/', require('./server/routes/index'));
app.use('/', require('./server/routes/dashboard'));

// Handle 404
app.get('*', function(req, res) {
  res.status(404).render('404');
});

// Start the server
server.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
