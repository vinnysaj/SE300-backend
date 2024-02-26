const Users = require(__dirname + "./../models/users.model.js").Users;
const Planes = require(__dirname + "./../models/planes.model.js").Planes;
const File = require(__dirname + "./../models/file.model.js").File;
const DebugAPI = require(__dirname + "./../lib/aircraftLookup.js");
const JSONbig = require('json-bigint');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const ocr = require('../PyOCR/requestOcrFunctions')


function authenticateToken(req, res, next) {
    token = null;
    if(req.body.token){
        token = req.body.token;
    } else if (req.user.token){
        token = req.user.token;
    }

    if (token == null) return res.sendStatus(401)
  
    jwt.verify(token, process.env.TOKEN_HASH, (err, user) => {
  
      if (err) return res.sendStatus(403)
      
      if(req.user){
        req.user.token.tokeninfo = user;
      } else if(req.body.token){
        req.body.tokeninfo = user;
      }
  
      next()
    })
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
    app.get('/app', isLoggedIn, authenticateToken, (req, res) => {
        console.log(req.user);
        res.render('userProfile', {
            profilephoto: req.user.picture,
            displayName: req.user.given_name,
            email: req.user.email,
            userid: req.user.id,
            token: req.user.token
        })
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
        req.session.destroy();
        res.redirect("/")
    });


    /* BEGIN USER */
    app.post('/api/user/get/byemail', authenticateToken, async (req, res) => {
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

    app.post('/api/user/get/byid', authenticateToken, async (req, res) => {
        const reqUser = await Users.findOne({
            where: {
                user_id: req.body.id
            }
        })
        if (reqUser === null) {
            res.send("NULL");
        } else {
            res.send(reqUser);
        }
    })

    //ASSIGNED AIRCRAFT
    app.post('/api/user/get/assignedaircraft', authenticateToken, async (req, res) => {
        const reqUser = await Users.findOne({
            where: {
                user_id: req.body.user_id
            }
        });
        if (reqUser === null) {
            res.send("NULL");
        } else {
            res.send(reqUser.planes);
        }
    })

    app.post('/api/user/update/assignedaircraft', authenticateToken, async (req, res) => {
        const reqUser = await Users.update({
            planes: req.body.planes
        }, {
            where: {
                user_id: req.body.user_id
            }
        });
        res.send(reqUser);
    })

    app.post('/api/user/delete/assignedaircraft', authenticateToken, async (req, res) => {
        const reqUser = await Users.update({
            planes: null
        }, {
            where: {
                user_id: req.body.user_id
            }
        });
        res.send(reqUser);
    })

    
    app.post('/api/user/get/assignedaircraftformatted', authenticateToken, async (req, res) => {
        if (req.body.user_id != null) {
            try {
                const user = await Users.findOne({
                    where: {
                        user_id: req.body.user_id
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
    app.post('/api/user/get/newuser', authenticateToken, async (req, res) => {
        const reqUser = await Users.findOne({
            where: {
                user_id: req.body.user_id
            }
        });
        if (reqUser === null) {
            res.send("NULL");
        } else {
            res.send(reqUser.is_new_user);
        }
    })

    app.post('/api/user/update/newuser',authenticateToken, async (req, res) => {
        const reqUser = await Users.update({
            is_new_user: false
        }, {
            where: {
                user_id: req.body.user_id
            }
        });
        res.send(reqUser);
    })
    // END NEW USER

    app.post('/api/user/update/phonenumber', authenticateToken, async (req, res) => {
        const reqUser = await Users.update({
            phone_number: req.body.phone_number
        }, {
            where: {
                user_id: req.body.user_id
            }
        });
        res.send(reqUser);
    })


    //AIRCRAFT

    app.post('/api/aircraft/get/bytail', authenticateToken, async (req, res) => {
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

    app.post('/api/aircraft/all', authenticateToken, async (req, res) => {
        Planes.findAll().then((planes) => {
            res.send(planes);
        });
    });

    app.post('/api/aircraft/update/hours', authenticateToken, async (req, res) => {
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



    /* BEGIN FILE MANAGMENT*/

    app.post('/api/file/get/all', authenticateToken, async (req, res) => {
        File.findAll().then((data) => {
            res.send(data);
        });
    });

    app.post('/api/file/delete/uid', authenticateToken, async (req,res) => {
        if(req.body.uid){
            File.findOne({ where: { uid: req.body.uid }}).then((data) => {
                if(data){
                    fs.unlinkSync(data.full_location).then((data) => {
                        res.sendStatus(200);
                    })
                } else {
                    res.sendStatus(404);
                }
            })
        }
    });

    


    /* END FILE MANAGMENT */

    /* BEGIN B64 POST */

    
    app.post('/api/ocr', authenticateToken, async (req, res) => {
        if (req.body.b64 != null && req.body.handwritten == true) {
            try {
                let text = ocr.getFromOcrEndpointCompgen(req.body.b64);
                res.send(text);

            } catch (error) {
                res.status(500).send('Server Error');
            }
        } else if(req.body.b64 != null && req.body.handwritten == false) {
            try {
                let text = ocr.getFromOcrEndpointHandwritten(req.body.b64);
                res.send(text);
            } catch (error) {
                res.status(500).send('Server Error');
            }
        } else {
            res.sendStatus(400);
        }
    });




}

module.exports = {
    startExternalRoutes: startExternalRoutes
}