/*
    Boundless Aircraft Maintenance Managment
    oAuth2 Implement Module
    Author: Christopher Allen
    Creation: 1/18/2024
    Last Modified: 1/27/2024 - Christopher Allen

    Changes:
    - added session tracking
    - added sequelize for ORM in auth.js
    - created seperate files for internal and external routes
    - added user ID to login page for debug only


    Start with npm start
    

*/
try {
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const internalDBRoutes = require(__dirname + "/routes/internalDBroutes.js");
const externalRoutes = require(__dirname + '/routes/externalRoutes.js');
require("./auth");
const app = express();
const app2 = express();
app.use(session({ secret: 'SE300!!', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.enable("trust proxy", true);
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json());
app2.use(express.json());
app2.set('view engine', 'pug');
app2.set('views', './internal_routes');
app2.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.set('view engine', 'pug');
app.set('views', './login_routes');
internalDBRoutes.startInternal(app2);
externalRoutes.startExternalRoutes(app,passport);
app.listen(8001, ()=>{ console.log("Oauth Running on Port 8001 for NGINX");})
app.listen(8000, ()=>{ console.log("Oauth Running on Port 8000 for NGINX");})
app2.listen(6969, ()=>{ console.log("Internal Query Server running on Port 6969");})
} catch (error) {
    console.log(error);
}