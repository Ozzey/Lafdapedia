if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const express = require('express')
const mongoose = require('mongoose')
const Article = require('./models/article')
const articleRouter = require('./routes/articles')
const methodOverride = require('method-override')

///***********************************///
const app = express()

 //Connecting to mongodb //
mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true,
                                              useUnifiedTopology: true,
                                              useCreateIndex: true})

//Setting up ejs reader//
app.set('view engine', 'ejs')

//Setting up url encoder//
app.use(express.urlencoded({ extended : false}))

//Method Override for deleting entries
app.use(methodOverride('_method'))

///*****************************************///

///SETTING UP PASSPORT LIBRARY FOR USER AUTH///

const passport = require('passport')
const flash = require('express-flash')
const session = require('cookie-session')
const bcrypt = require('bcrypt')


const users = [{id: process.env.id,
                    name: process.env.name,
                    email: process.env.email,
                    password: process.env.password}]

const initializePassport = require('./passport-config')
initializePassport(
  passport,
  email => users.find(user => user.email === email),
  id => users.find(user => user.id === id)
)


///Session Authentication///

app.use(flash())
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))

/// Authenticaion for specific pages///

///***********************************************///

//ADMIN LOGIN PAGE//

app.get('/admin/login', checkNotAuthenticated, (req, res) => {
  res.render('login.ejs')
})

app.post('/admin/login', checkNotAuthenticated, passport.authenticate('local', {
  successRedirect: '/admin',
  failureRedirect: '/admin/login',
  failureFlash: true
}
))

//ADMIN REGISTER PAGE//
app.get('/admin/register', checkAuthenticated, (req, res) => {
  res.render('register.ejs')
})

app.post('/admin/register', checkNotAuthenticated, async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    users.push({
      id: Date.now().toString(),
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword
    })
    res.redirect('/admin/login')
  } catch {
    res.redirect('/admin/register')
  }
  console.log(users)
})

///FUNCTION TO CHECK USER Authentication///
function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }

  res.redirect('/admin/login')
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/admin')
  }
  next()
}

///LOGOUT BUTTON///
app.delete('/logout', (req, res) => {
  req.logOut()
  res.redirect('/admin/login')
})

//**************************************************//
///MAIN APP FUNCTIONS

//GETTING DATA FROM DATABASE
app.get('/admin' , checkAuthenticated,async (req,res) =>  {
  const articles = await Article.find().sort({ createdAt: 'desc' })
  res.render('articles/index', { articles: articles })
})

app.get('/', async (req,res) => {
  const articles = await Article.find().sort({ createdAt: 'desc' })
  res.render('articles/home',  { articles: articles })
})

app.get('/home/:slug', async (req, res) => {
  const article = await Article.findOne({ slug: req.params.slug })
  if (article == null) res.redirect('/')
  res.render('articles/indArticles', { article: article })
})

///**********************************************///



app.use('/articles', articleRouter)

app.listen(5000)
