const express = require('express');
const app = express();
const PORT = 8080;
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.use(cookieParser());

const urlDatabase = {
  'b2xVn2': { longURL: 'http://www.lighthouselabs.ca', userID: 'aJ48lW'},
  '9sm5xK': { longURL: 'http://www.google.com', userID: 'aJ48lW' }
};

const users = {
  'userRandomID': {
    id: 'userRandomID',
    email: 'user@example.com',
    password: 'purple-monkey-dinosaur'
  },
  'user2RandomID': {
    id: 'user2RandomID',
    email: 'user2@example.com',
    password: 'dishwasher-funk'
  }
};

const generateRandomString = () => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const idLength = 6;
  for (let i = 0; i < idLength; i++) {
    result += characters[Math.floor(Math.random() * characters.length)];
  }
  return result;
};

const emailInUsers = (findEmail) => {
  for (let user in users) {
    if (users[user].email === findEmail) {
      return true;
    }
  }
  return false;
};

const urlsForUser = (id) => {
  const urls = {};
  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      urls[url] = urlDatabase[url];
    }
  }
  return urls;
};

app.post('/urls', (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {};
  urlDatabase[shortURL].longURL = req.body.longURL;
  urlDatabase[shortURL].userID = req.cookies['user_id'];
  res.redirect(`/urls/${shortURL}`);
});

app.post('/urls/:shortURL/delete', (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

app.get('/urls/:shortURL/delete', (req, res) => {
  console.log(urlDatabase);
  res.redirect('/urls');
});

app.post('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  if (req.body.longURL) {
    urlDatabase[shortURL].longURL = req.body.longURL;
  }
  res.redirect(`/urls/${shortURL}`);
});

app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  let userID;
  if (!emailInUsers(email)) {
    res.statusCode = 403;
    throw new Error(`No account associated with email.\nStatus code: ${res.statusCode}`);
  }
  for (let user in users) {
    if (users[user]['email'] === email) {
      userID = user;
    }
  }
  if (password !== users[userID].password) {
    res.statusCode = 403;
    throw new Error(`Incorrect Password.\nStatus code: ${res.statusCode}`);
  }
  res.cookie('user_id', userID);
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

app.post('/register', (req, res) => {
  const newUserID = generateRandomString();
  if (req.body.email === '' || req.body.password === '') {
    res.statusCode = 400;
    throw new Error(`Email or password field left empty.\nStatus code: ${res.statusCode}`);
  } else if (emailInUsers(req.body.email)) {
    res.statusCode = 400;
    throw new Error(`There is already an account associated with this email.\nStatus code: ${res.statusCode}`);
  } else {
    const newUser = {
      id: newUserID,
      email: req.body.email,
      password: req.body.password
    };
    users[newUserID] = newUser;
    res.cookie('user_id', newUserID);
    res.redirect('/urls');
  }
});

app.get('/urls/new', (req, res) => {
  if (!req.cookies['user_id']) {
    res.redirect('/login');
  }
  const user = users[req.cookies['user_id']];
  const urls = urlsForUser(user);
  const templateVars = { user, urls };
  res.render('urls_new', templateVars);
});

app.get('/urls/:shortURL', (req, res) => {
  const user = users[req.cookies['user_id']];
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
  const user = users[req.cookies['user_id']];
  const templateVars = { user, urls: urlDatabase };
  res.render('login', templateVars);
});

app.get('/urls', (req, res) => {
  const user = users[req.cookies['user_id']];
  let urls = {};
  if (user) {
    urls = urlsForUser(user.id);
  }
  const templateVars = { user, urls};
  res.render('urls_index', templateVars);
});

app.get('/register', (req, res) => {
  const user = users[req.cookies['user_id']];
  const templateVars = { user, urls: urlDatabase };
  res.render('register', templateVars);
});

app.get('/', (req, res) => {
  res.send('Hello!');
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html>\n');
});

app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});