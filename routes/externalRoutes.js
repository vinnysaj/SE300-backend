const Users = require(__dirname + "./../models/users.model.js").Users;
const Planes = require(__dirname + "./../models/planes.model.js").Planes;
const File = require(__dirname + "./../models/file.model.js").File;
const DebugAPI = require(__dirname + "./../lib/aircraftLookup.js");
const JSONbig = require('json-bigint');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const ocr = require('../PyOCR/requestOcrFunctions');
const axios = require("axios");


function authenticateToken(req, res, next) {
    token = null;
    try {
        if(req.headers.authorization.split(' ')[1]){
            token = req.headers.authorization.split(' ')[1]
        } else {
            res.status(400).send("Invalid Token Parameter");
        }
    } catch (error) {
        res.status(500).send("Internal Server Error at Token Authentication");
    }

    if (token == null) return res.sendStatus(401);
  
    jwt.verify(token, process.env.TOKEN_HASH, (err, user) => {
  
      if (err) return res.sendStatus(403)
      
      if(req.user){
        req.user.token.tokeninfo = user;
      } else if(req.body.token){
        req.body.tokeninfo = user;
      } else if(req.headers.authorization.split(' ')[1]){
        req.body.tokeninfo = user;
      }
      
      next();
    })
  }

function isUserAdmin(req,res,next){
    // NOTICE: this SHOULD only occur after authenticateToken()
    var currentUserUsername = req.body.tokeninfo.username;
    Users.findOne({where: {
        email: currentUserUsername
    }}).then((data) => {
        if(data){
            if(data.admin){
                next();
            } else {
                return res.sendStatus(403);
            }
        }
    })
}

function isUserAccessingOwnAccount(req,res,next){
    if(req.body.tokeninfo.username){
        Users.findOne({where: {
            user_id: req.body.tokeninfo.username.id
        }}).then(async (data) => {
            if(data){
                if(req.body.tokeninfo.username.id){
                if(data.user_id == req.body.tokeninfo.username.id || data.admin){
                    next();
                } else {
                    res.sendStatus(403);
                }
            } else {
                res.sendStatus(400);
            }
            }
        })
    }
}

function isUserAccessingOwnAircraft(req,res,next){
    if(req.body.tokeninfo.username){
        Users.findOne({where: {
            email: req.body.tokeninfo.username
        }}).then(async (data) => {
            // do things here
            if(data){
                var currentUserId = data.user_id;
                if(req.body.tail){
                    Planes.findOne({where: {
                        reg: req.body.tail
                    }}).then(async (data) => {
                        if(data.owner_id == currentUserId){
                            next()
                        } else {
                            res.sendStatus(403);
                        }
                    })
                } else {
                    res.sendStatus(400);
                }
                
            }
        });
    }
}

function isLoggedIn(req, res, next) {
    // reject user if they do not have authentication
    req.user ? next() : res.sendStatus(401);
}

function startExternalRoutes(app, passport) {
    // Temporary Solution Until hard route is in place @FIXME
    app.get('/', (req, res) => {
        res.render('login');
    })

    app.get('/auth/google', passport.authenticate('google', {
        scope: ['email', 'profile']
    }));

    //protected route
    app.get('/app', (req, res) => {
        res.cookie('auth_token', req.user.token, { domain: '*', secure: false, httpOnly: false });
        res.redirect('http://127.0.0.1:8000/user/callback?token='+ req.user.token);
    })

    app.get('/google/callback', 
        passport.authenticate('google', {
            successRedirect: '/app',
            failureRedirect: '/auth/failure'
        }));

    app.get('/auth/failure', (req, res) => {
        res.send("Authentication failure, please try again later.");
    })

    app.get('/logout', (req, res) => {
        req.logout((err) => {
            if (err) throw err;
        });
        res.redirect("/");
    });



    /* BEGIN USER */ 
    //restricted call
    app.post('/api/user/get/byemail', authenticateToken, isUserAdmin, async (req, res) => {
        app.set('view engine', 'pug');
        app.set('views', './internal_routes');

        const reqUser = await Users.findOne({
            where: {
                email: req.body.email
            }
        })
        if (reqUser === null) {
            res.send("NULL");
        } else {
            res.send(reqUser);
        }
    })

    //vinnys awful shennanigans is here
    app.get('/api/token/getuser', async (req,res) => {
        try{
        if(req.headers.authorization.split(' ')[1]){
            jwt.verify(req.headers.authorization.split(' ')[1], process.env.TOKEN_HASH, (err, user) => {
                if (err) return res.sendStatus(403)
                if(user){
                   Users.findOne({where: { email: user.username.email }}).then((data) => {
                    data.token = req.body.token;
                    res.send(data.dataValues);
                   });
                }
              })
        } else {
            res.sendStatus(400);
        }
    } catch (error){
        res.sendStatus(403);
    }
    });

    //restricted call
    app.post('/api/user/get/byid', authenticateToken, isUserAdmin, async (req, res) => {
        const reqUser = await Users.findOne({
            where: {
                user_id: req.body.tokeninfo.username.id
            }
        })
        if (reqUser === null) {
            res.send("NULL");
        } else {
            res.send(reqUser);
        }
    })

    //ASSIGNED AIRCRAFT
    app.get('/api/user/get/assignedaircraft', authenticateToken, isUserAccessingOwnAccount, async (req, res) => {
        try{
            Planes.findAll({
                where: {
                    owner_id: req.body.tokeninfo.username.id
                }
            }).then((data) => {
                if(data){
                    res.send(data);
                } else {
                    res.send({});
                }
            })
        } catch (error) {
            res.send(500);
        }
        
    })

    app.get('/api/user/update/assignedaircraft', authenticateToken, isUserAccessingOwnAccount, async (req, res) => {
        const reqUser = await Users.update({
            planes: req.body.planes
        }, {
            where: {
                user_id: req.user.token.tokeninfo.user_id
            }
        });
        res.send(reqUser);
    })


    app.post('/api/user/delete/assignedaircraft', authenticateToken, isUserAccessingOwnAccount, async (req, res) => {
        const reqUser = await Users.update({
            planes: null
        }, {
            where: {
                user_id: req.body.tokeninfo.username.id
            }
        });
        res.send(reqUser);
    })

    app.post('/api/user/update/nickname', authenticateToken, isUserAccessingOwnAccount, async (req, res) => {
        if(req.body.nickname){
            try {
                Users.update({ nickname: req.body.nickname}, {where : { 
                    user_id : req.body.tokeninfo.username.id
                }}).then((data) => {
                    res.sendStatus(200);
                });
            } catch(error) {
                console.log(error);
                res.sendStatus(500);
            }
        }
    });

    app.post('/api/user/get/nickname', authenticateToken, isUserAccessingOwnAccount, async (req, res) => {
        if(req.body.nickname){
            try {
                Users.findOne({where: {
                    user_id: req.body.tokeninfo.username.id
                }}).then((data) => {
                    res.send(data.nickname);
                })
            } catch(error) {
                console.log(error);
                res.sendStatus(500);
            }
        }
    });

    
    app.post('/api/user/get/assignedaircraftformatted', authenticateToken, isUserAccessingOwnAccount, async (req, res) => {
        if (req.body.tokeninfo.username.id != null) {
            try {
                const user = await Users.findOne({
                    where: {
                        user_id: req.body.tokeninfo.username.id
                    }
                });
                if (user) {
                    const assignedPlanes = JSON.parse(user.planes).planes;
                    let formattedList = [];

                    for (const planeid of assignedPlanes) {
                        const plane = await Planes.findOne({
                            where: {
                                reg: planeid
                            }
                        });
                        if (plane) {
                            formattedList.push(plane);
                        }
                    }

                    res.send(formattedList);
                } else {
                    res.status(404).send('User not found');
                }
            } catch (error) {
                res.status(500).send('Server error');
            }
        } else {
            res.sendStatus(400);
        }
    });

    //END ASSIGNED AIRCRAFT

    //NEW USER
    app.post('/api/user/get/newuser', authenticateToken, isUserAccessingOwnAccount, async (req, res) => {
        const reqUser = await Users.findOne({
            where: {
                user_id: req.body.tokeninfo.username.id
            }
        });
        if (reqUser === null) {
            res.send("NULL");
        } else {
            res.send(reqUser.is_new_user);
        }
    })

    app.post('/api/user/update/newuser',authenticateToken, isUserAccessingOwnAccount, async (req, res) => {
        const reqUser = await Users.update({
            is_new_user: false
        }, {
            where: {
                user_id: req.body.tokeninfo.username.id
            }
        });
        res.send(reqUser);
    })
    // END NEW USER

    app.post('/api/user/update/phonenumber', authenticateToken, isUserAccessingOwnAccount, async (req, res) => {
        const reqUser = await Users.update({
            phone_number: req.body.phone_number
        }, {
            where: {
                user_id: req.body.tokeninfo.username.id
            }
        });
        res.send(reqUser);
    })

    app.post('/api/user/update/profileimage', authenticateToken, isUserAccessingOwnAccount, async(req,res) => {
        if(req.body.b64){
            try {
                Users.update({ profile_image_b64 : req.body.b64}, { where: { 
                    user_id: req.body.tokeninfo.username.id
                 }})
            } catch (e){
                res.sendStatus(500);
            }
        }
    });


    //AIRCRAFT

    app.post('/api/aircraft/get/bytail', authenticateToken, isUserAccessingOwnAircraft, async (req, res) => {

        Planes.findOne({
            where: {
                reg: req.body.tail
            }
        }).then((plane) => {
            if (plane != null) {
                res.send(plane);
            } else {
                res.send(null);
            }
        });
    });

    app.post('/api/aircraft/new/document', authenticateToken, isUserAccessingOwnAircraft, async (req,res) => {
        if(req.body.tail && req.body.b64) {
            Planes.findOne({where : { reg: req.body.tail }}).then((data) => {
                if(data){

                }
            })
        } else {
            res.send('Incomplete Request').sendStatus(400);
        }
    });

    app.post('/api/aircraft/update/coverphoto', authenticateToken, isUserAccessingOwnAircraft, async (req,res) => {
        if(req.body.tail && req.body.b64){
            Planes.update({ where : { reg: req.body.tail } }, { cover_file_b64: req.body.b64 }).then((data) => {
                res.send(data);
            });
        } else {
            res.send('Incomplete Request').sendStatus(400);
        }
    });

    app.post('/api/aircraft/all', authenticateToken, isUserAdmin, async (req, res) => {
        Planes.findAll().then((planes) => {
            res.send(planes);
        });
    });

    app.post('/api/aircraft/update/hours', authenticateToken, isUserAccessingOwnAircraft, async (req, res) => {
        if (req.body.tail != null && req.body.hours != null) {
            try {
                Planes.update({
                    where: {
                        reg: req.body.tail
                    }
                }, {
                    hours: req.body.hours
                }).then((data) => {
                    res.send(data)
                })
            } catch (error) {
                res.status(500).send('Server Error');
            }
        } else {
            res.sendStatus(400);
        }
    });

    

    //END AIRCRAFT




    /* BEGIN Blob POST */


    app.post('/api/ocr', authenticateToken, async (req, res) => {
        if (req.body.blob != null && req.body.handwritten == "False") {
            try {
                axios.post('http://localhost:5000/ocr/compgen/', {
                    blob: req.body.blob
                  })
                  .then(function (response) {
                    res.send(response.data);
                  })
                  .catch(function (error) {
                    console.log(error);
                    res.sendStatus(500);
                  });
            } catch (error) {
                console.log(error);
                res.status(500).send('Server Error');
            }
        } else if(req.body.blob != null && req.body.handwritten == "True") {
            try {
                axios.post('http://localhost:5000/ocr/handwritten/', {
                    blob: req.body.blob
                  })
                  .then(function (response) {
                    res.send(response.data);
                  })
                  .catch(function (error) {
                    console.log(error);
                    res.sendStatus(500);
                  });
                
            } catch (error) {
                console.log(error);
                res.status(500).send('Server Error');
            }
        } else {
            res.sendStatus(400);
        }
    });

    /* END Blob POST */



}

module.exports = {
    startExternalRoutes: startExternalRoutes
}