const express = require('express');
const app = express();
const PORT = 8080;
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const { getUserByEmail } = require('./helpers');

app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

const urlDatabase = {
  'b2xVn2': { longURL: 'http://www.lighthouselabs.ca', userID: 'aJ48lW'},
  '9sm5xK': { longURL: 'http://www.google.com', userID: 'aJ48lW' }
};

const users = {
  'userRandomID': {
    id: 'userRandomID',
    email: 'user@example.com',
    password: '$2b$10$/CT1AxpiufnbkI4a1gTrweJkxuFgMMpG1rfoyOZp4Nv6RWRQxORAS'
  },
  'user2RandomID': {
    id: 'user2RandomID',
    email: 'user2@example.com',
    password: '$2b$10$/CT1AxpiufnbkI4a1gTrweJkxuFgMMpG1rfoyOZp4Nv6RWRQxORAS'
  }
};

// Generates a random alpha-numeric string to be used as url id or user id.
const generateRandomString = () => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const idLength = 6;
  for (let i = 0; i < idLength; i++) {
    result += characters[Math.floor(Math.random() * characters.length)];
  }
  return result;
};

// Takes in a user id as an argument and returns an object of all urls belonging to that user.
const urlsForUser = (id) => {
  const urls = {};
  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      urls[url] = urlDatabase[url];
    }
  }
  return urls;
};


// POST REQUESTS
//
app.post('/urls', (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {};
  urlDatabase[shortURL].longURL = req.body.longURL;
  urlDatabase[shortURL].userID = req.session.user_id;
  res.redirect(`/urls/${shortURL}`);
});

app.post('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  if (req.body.longURL) {
    urlDatabase[shortURL].longURL = req.body.longURL;
  }
  res.redirect('/urls');
});

app.post('/urls/:shortURL/delete', (req, res) => {
  if (!req.session.user_id) {
    return res.status(400).send('Not Logged in.');
  }
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');

});

app.post('/register', (req, res) => {
  const newUserID = generateRandomString();
  if (req.body.email === '' || req.body.password === '') {
    res.status(400).send('Username and/or password field left empty.');
  } else if (getUserByEmail(req.body.email, users)) {
    res.status(400).send('There is already an account associated with this email.');
  } else {
    const hashedPassword = bcrypt.hashSync(req.body.password, 10);
    const newUser = {
      id: newUserID,
      email: req.body.email,
      password: hashedPassword
    };
    users[newUserID] = newUser;
    req.session.user_id = newUserID;
    res.redirect('/urls');
  }
});

app.post('/login', (req, res) => {
  const email = req.body.email;
  const user = getUserByEmail(email, users);
  if (!user) {
    res.status(403).send('No account associated with email.');
  }
  const hashedPassword = users[user].password;
  if (!bcrypt.compareSync(req.body.password, hashedPassword)) {
    res.status(403).send('Password incorrect');
  }
  req.session.user_id = user;
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});


// GET REQUESTS
app.get('/urls/new', (req, res) => {
  if (!req.session.user_id) {
    res.redirect('/login');
  }
  const user = users[req.session.user_id];
  const urls = urlsForUser(user);
  const templateVars = { user, urls };
  res.render('urls_new', templateVars);
});

app.get('/urls/:shortURL', (req, res) => {
  const user = users[req.session.user_id];
  let allowed;
  if (user) {
    allowed = (user.id === urlDatabase[req.params.shortURL].userID);
  }
  const templateVars = {
    user,
    allowed,
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL
  };
  res.render('urls_show', templateVars);
});

app.get('/login', (req, res) => {
  const user = users[req.session.user_id];
  const templateVars = { user, urls: urlDatabase };
  if (req.session.user_id) {
    res.redirect('/urls');
  }
  res.render('login', templateVars);
});

// Page that displays all of the users urls
app.get('/urls', (req, res) => {
  const user = users[req.session.user_id];
  let urls = {};
  if (user) {
    urls = urlsForUser(user.id);
  }
  const templateVars = { user, urls};
  res.render('urls_index', templateVars);
});

// Handles registering a new user
app.get('/register', (req, res) => {
  const user = users[req.session.user_id];
  const templateVars = { user, urls: urlDatabase };
  if (req.session.user_id) {
    res.redirect('/urls');
  }
  res.render('register', templateVars);
});

app.get('/', (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  }
  res.redirect('/login');
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

// Takes you to the webpage of the longURL
app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

// Delete specified URL from urlDatabase and redirect to /urls
app.get('/urls/:shortURL/delete', (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});