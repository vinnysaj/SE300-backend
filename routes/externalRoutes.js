function isLoggedIn(req,res,next){
    // reject user if they do not have authentication
    req.user ? next() : res.sendStatus(401);
}

function startExternalRoutes(app,passport){
// Temporary Solution Until hard route is in place @FIXME
app.get('/', (req,res) => {
    res.render('login');
})

app.get('/auth/google', passport.authenticate('google', {scope: ['email','profile']}));

//protected route
app.get('/app', isLoggedIn, (req,res) => {
    res.render('userProfile', { profilephoto: req.user.picture, displayName: req.user.given_name, email: req.user.email, userid: req.user.id })
})

app.get('/google/callback',
passport.authenticate('google', {
    successRedirect: '/app',
    failureRedirect: '/auth/failure'
}));

app.get('/auth/failure',(req,res) => {
    res.send("Authentication failure, please try again later.");
})

app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) throw err;
    });
    req.session.destroy();
    res.redirect("/")
  });

}

module.exports = { startExternalRoutes : startExternalRoutes}