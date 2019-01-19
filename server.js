// var users = [
//     {id: 1, username: 'bob', password: 'secret', email: 'bob@example.com'}
//     , {id: 2, username: 'scott', password: 'password', email: 'scott@example.com'}
// ];
//
// /* Search Function */
//
// function findByEmail(email, callback) {
//     for (var i = 0, len = users.length; i < len; i++) {
//         var user = users[i];
//         if (user.email === email) {
//             // callback takes arguments (error,user)
//             return callback(null, user);
//         }
//     }
//     return callback(null, null);
// }

/* Express */

const express = require('express')
const exphbs = require('express-handlebars')
//const fs = require('fs-plus')
const app = express()
var bodyParser = require('body-parser')
const cookieSession = require('cookie-session')
const db = require('./models')
const queryFile = require('./routes/queries/query.js')

app.use(express.static('Public'))

app.engine('handlebars', exphbs({defaultLayout: 'main'}))
app.set('view engine', 'handlebars')

app.get('/', function (req, res) {
    // res.sendFile('login.html', { root : __dirname })


      // var i;
      // for (i = 0; i < Dog.length; i++) {

      // }
      res.render('home')
    })


app.get('/login', function (req, res) {
  res.render('login')
})

app.get('/signup', function (req, res) {
  res.render('signup')
})

/* Express Validator */

const { body,validationResult } = require('express-validator/check')
const { sanitizeBody } = require('express-validator/filter')

/* cookieSession config */

app.use(cookieSession({
    name: 'session',
    maxAge: 24 * 60 * 60 * 1000, //one day in milliseconds
    keys: ['randomstringhere']
}))

/* Passport Setup */

const passport = require('passport')
app.use(passport.initialize())
app.use(passport.session())

app.get('/success', function (req, res) {
  res.send("You have successfully logged in")
})
app.get('/error', function (req, res) {
  res.send("Error logging in")
})

passport.serializeUser(function(user, cb) {
  cb(null, user)
})

passport.deserializeUser(function(obj, cb) {
  cb(null, obj)
})

/* Local Auth */

// figure out db (database user id searching) //

const LocalStrategy = require('passport-local').Strategy

passport.use(new LocalStrategy({
        // this maps the file names in the html file to the passport stuff
        usernameField: 'emailLogin',
        passwordField: 'passwordLogin'
    },
    function (email, password, done) {
        // replace this with our search function, mysql/monogo/service/etc
        //findByEmail(email, function (err, user) {
        db.User.findOne({ where: {email: email} })
          .then((user) => {
            console.log('user: ', user.dataValues)

            if (!user) {
                console.log('bad email')
                return done(null, false, {message: 'Incorrect email.'});
            } else {
                if (user.password === password) {
                    console.log('good email and password');
                    return done(null, user.dataValues);
                } else {
                    console.log('good email and bad password');
                    return done(null, false, {message: 'Incorrect password.'});
                }
            }
          })
          .catch((err) => {
            return done(err, false)
          })

    }
))

app.use(bodyParser.urlencoded({extended: false}))

/* Facebook Auth */

const FacebookStrategy = require('passport-facebook').Strategy

const FACEBOOK_APP_ID = '1972214219741500'
const FACEBOOK_APP_SECRET = '52caefe50fa829ae902d8c69c60617dd'

passport.use(new FacebookStrategy({
  clientID: FACEBOOK_APP_ID,
  clientSecret: FACEBOOK_APP_SECRET,
  callbackURL: "/auth/facebook/callback"
},
function (accessToken, refreshToken, profile, cb) {
  return cb(null, profile)
}
))

/* HTTP Methods */

app.post('/login', function (req, res, next) {
  console.log('req.body: ', req.body)
    passport.authenticate('local', function (err, user, info) {
        console.log(err, user, info);
        if (user) {
          queryFile.findCart()
            .then ((cart) => {
              console.log(cart)
            })
            .catch ((err) => {
              console.log('Error:', err)
            })

          res.render('home', {user: user})

        } else {
            res.render('login', {error: err, info: info});
        }
    })(req, res, next);
});

app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/callback',
  passport.authenticate('facebook', {failureRedirect: '/error'}),
  function(req, res) {
    res.redirect('/success')
})

const api = require('./routes/routes.js')
app.use('/api', api)

app.listen(process.env.PORT || 3000, () => {
    console.log('Listening on port 3000.')
})
