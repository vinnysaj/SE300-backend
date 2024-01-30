const passport = require('passport');
const Users = require(__dirname + "/models/users.model.js").Users;
const login_logs = require(__dirname + "/models/login_logs.model.js").login_logs;




const GoogleStrategy = require('passport-google-oauth2').Strategy;

const GOOGLE_CLIENT_ID = process.env.google_oauth_key;
const GOOGLE_CLIENT_SECRET = process.env.google_secret;

passport.use(new GoogleStrategy({
    clientID:     GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "https://auth.boundlessflight.net/google/callback",
    passReqToCallback   : true,
    cookie: { secure: true },
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
        is_new_user: true
      })
      userDidLogin(profile.id,request.headers['x-forwarded-for']);
    } else {
      //current user
      //lets log this
      userDidLogin(profile.id,request.headers['x-forwarded-for']);
      
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