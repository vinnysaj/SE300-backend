const passport = require('passport');
const Users = require(__dirname + "/models/users.model.js").Users;
const login_logs = require(__dirname + "/models/login_logs.model.js").login_logs;
const jwt = require('jsonwebtoken');
//var request = require('request').defaults({ encoding: null });

function generateAccessToken(username) {
  return jwt.sign(username, process.env.TOKEN_HASH, { expiresIn: '7 days' });
}
const GoogleStrategy = require('passport-google-oauth2').Strategy;

const GOOGLE_CLIENT_ID = process.env.google_oauth_key;
const GOOGLE_CLIENT_SECRET = process.env.google_secret;




var MicrosoftStrategy = require('passport-microsoft').Strategy;
    passport.use(new MicrosoftStrategy({
        // Standard OAuth2 options
        clientID: 'eb170940-8f95-41b4-9a92-f6d6fe433f4a',
        clientSecret: '5d7d46fd-2808-4469-9788-83f8a270f21a',
        callbackURL: "https://auth.boundlessflight.net/microsoft/callback",
        scope: ['user.read'],

        // Microsoft specific options

        // [Optional] The tenant for the application. Defaults to 'common'. 
        // Used to construct the authorizationURL and tokenURL
        tenant: 'common',

        // [Optional] The authorization URL. Defaults to `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`
        authorizationURL: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',

        // [Optional] The token URL. Defaults to `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`
        tokenURL: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      },
      function(accessToken, refreshToken, profile, done) {
        User.findOrCreate({ userId: profile.id }, function (err, user) {
          return done(err, user);
        });
      }
    ));



passport.use(new GoogleStrategy({
    clientID:     GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "https://auth.boundlessflight.net/google/callback",
    passReqToCallback   : true,
    cookie: { secure: false },
    proxy: true
  },
  async function(request, accessToken, refreshToken, profile, done) {
    const selectUser = await Users.findOne({
      where: {
        email : profile.email,
        user_id : profile.id,
      }
    })
    if(selectUser == null){
      //new user
      Users.create({
        user_id: profile.id,
        email: profile.email,
        name: profile.given_name,
        is_new_user: true,
        profile_image: profile.picture
      })
      userDidLogin(profile.id,request.headers['x-forwarded-for']);
      profile.token = generateAccessToken( { username: profile} );
    } else {
      //current user
      //lets log this
      userDidLogin(profile.id,request.headers['x-forwarded-for']);
      profile.token = generateAccessToken( { username: profile } );
      console.log(profile.token);
    }

    return done(null, profile);
  }
));

async function userDidLogin(userid,ip_address){
  const done = await login_logs.create({
    user_id: userid,
    ip_address: ip_address,
  })
}

passport.serializeUser(function(user,done){
    done(null,user);
});


passport.deserializeUser(function(user,done){
    done(null,user);
});

module.export = {
  Users: Users
}
