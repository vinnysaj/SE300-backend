const Users = require(__dirname + "./../models/users.model.js").Users;
const express = require('express');
const Planes = require(__dirname + "./../models/planes.model.js").Planes;
const mlog_files = require(__dirname + "./../models/mlog_files.model.js").mlog_files;
const mlog = require(__dirname + "./../models/mlog.model.js").mlog;
const Files = require(__dirname + "./../models/file.model.js").files;
const adsB = require(__dirname + "./../models/adsb.model.js").adsb;
const DebugAPI = require(__dirname + "./../lib/aircraftLookup.js");
const { createCanvas, loadImage, Image } = require('canvas');
const JSONbig = require('json-bigint');
const defaultb64 = require('../default_b64.js').b64;
const jwt = require('jsonwebtoken');
const fs = require('fs');
const ocr = require('../PyOCR/requestOcrFunctions');
const axios = require("axios");
const { files } = require('../models/file.model');


function makeid(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKL-MNOPQRSTUVWXYZab-cdefghijklmnopqrstuvwxyz0123456789-';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}

//give me a random string when we start up
console.log("Iteration: " + makeid(5));


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


    app.get('/auth/microsoft',
    passport.authenticate('microsoft', {
      prompt: 'select_account',
    }));

    app.get('/microsoft/callback', 
    passport.authenticate('microsoft', { failureRedirect: '/login' }),
    function(req, res) {
      // Successful authentication, redirect home.
      res.redirect('/');
    });

    app.get('/auth/google', passport.authenticate('google', {
        scope: ['email', 'profile']
    }));

    //protected route
    app.get('/app', (req, res) => {
        if(req.user.token){
            res.cookie('auth_token', req.user.token, { domain: '*', secure: false, httpOnly: false });
            res.redirect('http://127.0.0.1:8000/user/callback?token='+ req.user.token);
        } else {
            console.log('Someones request couldnt be found');
            res.send("Your request contained no token");
        }
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
    
    //ASSIGNED AIRCRAFT... ADS-B edition!!
    app.get('/api/user/get/assignedaircraft/adsb', authenticateToken, isUserAccessingOwnAccount, async (req, res) => {
        try {
            const limit = req.body.limit;
            adsB.findAll({
                where: {
                    tail: req.body.tailNumber
                },
                order: [['id', 'DESC']], // descending, most recent first!
                limit: limit
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

    app.post('/api/user/add/assignedaircraft', authenticateToken, isUserAccessingOwnAccount, async (req, res) => {
        try {
            if (!req.body) {
                return res.status(400).send("POST request must have a body");
            }
            
            if (!req.body.tailNumber) {
                return res.status(400).send("Request body must include tailNumber property");
            }
            
            var hoursData = 0
            
            if (req.body.hours) {
                hoursData = req.body.hours;
            }
            
            if (!req.body.personalPlaneName) {
                return res.status(400).send("Request body must include personalPlaneName property");
            }            
        
            const tailNumber = req.body.tailNumber;
            
            const userid = req.body.tokeninfo.username.id;
            
            try {
                const data = await DebugAPI.pullNewAircraft(tailNumber);
                if (data == null) {
                    res.status(400).send('Unable to fetch plane information from tail # Error!');
                } else {
                    const existingPlane = await Planes.findOne({
                        where: {
                            tail: tailNumber,
                            owner_id: userid
                        }
                    });
                    if (existingPlane === null) {
                        var newID = makeid(25);
                        var b64 = defaultb64;
                        // I am SO SORRY Chris. This was just too funny. I had to include it straight up.
                        Files.create({
                            file_uid: newID,
                            b64: b64,
                            mimetype: "data:image/png;base64,",
                            user_id_uploaded: userid,
                            timestamp: Date.now(),
                            type: "plane_cover_img",
                            linked_aircraft_tail: tailNumber,
                            hand_written: false
                        }).then((r1) => {
                            if (r1 == null) {
                                res.status(404).send("Unable to create file")
                            } else {
                                console.log("Created a new plane's image!");
                                console.log(r1);
                                const newPlane = {
                                    tail: tailNumber,
                                    active: data.data.active,
                                    serial: data.data.serial,
                                    icao: data.data.hexIcao,
                                    regowner: data.data.airlineName,
                                    model: data.data.model,
                                    typeName: data.data.typeName,
                                    hours: hoursData,
                                    owner_id: userid,
                                    friendly_name: req.body.personalPlaneName,
                                    cover_file_b64: newID
                                };
                                return Planes.create(newPlane);
                                res.status(201).send(createdPlane);
                            }
                        }).then((createdPlane) => {
                            res.status(201).send(createdPlane);
                        })
                        .catch((error) => {
                            console.error(error);
                            res.status(500).send("An error occurred");
                        });
                    } else {
                        res.status(400).send('Plane with this tail number already exists for this user');
                    }
                }
            } catch (error) {
                console.error('Error fetching aircraft data:', error);
                res.status(500).send('An error occurred while fetching aircraft data');
            }
        } catch(error) {
            console.error(error);
            res.status(500).send('An error occurred while adding a new plane.');
        }
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

    app.post('/api/user/self/delete', authenticateToken, isUserAccessingOwnAccount, async (req,res) => {
        Users.destroy({ where: { user_id: req.body.tokeninfo.username.id}});
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

    app.post('/api/user/download', authenticateToken, async(req,res) => {
        Users.findOne({ where : { user_id: req.user.token.tokeninfo }}).then((data) => {
            if(data){
                res.send(data);
            }
        });
    });


    /* BEGIN Blob POST */


    //THIS IS FILE MANAGMENT FOR BOUNDLESSos

    //upload new document
    //req.body.tail
    //req.body.handwritten
    //req.body.blob
    //req.body.type ex: maint, registration, photo-of-something (set your own or provide empty string)
    //req.body.title (name) ex: 2024 Maintenance Book or 2023 Tax Evasion Documents
    app.post('/api/file/upload', authenticateToken, isUserAccessingOwnAircraft, async(req,res) => {
        if(req.body.blob && req.body.tail && req.body.handwritten && req.body.type){
            var newID = makeid(25);
            var tail = req.body.tail;
            var user = req.user.token.username.id;
            var handwritten = req.body.handwritten;
            File.create({
                file_uid: newID,
                b64: req.body.blob,
                user_id_uploaded: user,
                timestamp: Date.now(),
                type: req.body.type,
                linked_aircraft_tail: tail,
                hand_written: handwritten
            }).then(() => {
                res.status(200).send(newID);
            })
        } else {
            res.status(500).send('Missing input data: you provided' + req.body);
        }
    });
    
    app.post('/api/assignedaircraft/cover_img/upload', authenticateToken, isUserAccessingOwnAircraft, async(req,res) => {
        if (req.body.blob && req.body.tail && req.body.type) {
            var newID = makeid(25);
            var tail = req.body.tail;
            var userid = req.user.token.username.id;
            var b64 = req.body.b64;
            File.create({
                file_uid: newID,
                b64: b64,
                user_id_uploaded: userid,
                timestamp: Date.now(),
                type: "plane_cover_img",
                linked_aircraft_tail: tail,
                hand_written: false
            }).then((r1) => {
                if (r1 == null) {
                    res.status(404).send("Unable to create file")
                } else {
                    Planes.update( { where: { tail: tail, owner_id: userid }}, { cover_file_b64: newID})
                    .then((r2) => {
                        if (r2 == null) {
                            res.status(404).send("Invalid tail number for user")
                        } else {
                            res.status(200).send(newID);
                        }
                    })
                }
            })
        } else {
            res.status(500).send('Missing input data: you provided' + req.body);
        }
    });

    //get all documents for aircraft
    //req.body.tail
    app.post('/api/file/list', authenticateToken, isUserAccessingOwnAircraft, async(req,res) => {
        if(req.body.tail){
            file.findAll({ where: {
                linked_aircraft_tail: req.body.tail
            }}).then((data) => {
                res.send(data);
            })
        } else {
            res.status(500).send('Missing input data: you provided' + req.body);
        }
    });

    //get specific document
    //req.body.fileid
    //req.body.tail
    app.get('/api/file/get', authenticateToken, isUserAccessingOwnAircraft, async(req,res) => {
        if(req.body.tail){
            file.findOne({where: { file_uid: req.body.fileid, linked_aircraft_tail: req.body.tail }}).then((data) => {
                res.send(data);
            })
        }
    });

    //change the order of an aircraft
    //req.body.tail
    //req.body.fileid
    //req.body.order
    app.post('/api/file/order', authenticateToken, isUserAccessingOwnAircraft, async(req,res) => {
        if(req.body.fileid && req.body.tail && req.body.order){
            file.update({ order: req.body.order }, {where: { linked_aircraft_tail: req.body.tail, file_uid: req.body.fileid }}).then((data) => {
                res.send(data);
            })
        } else {
            res.status(500).send('Missing input data: you provided' + req.body);
        }
    });

    //GET the order of an aircraft
    //req.body.tail
    //req.body.fileid
    app.get('/api/file/order', authenticateToken, isUserAccessingOwnAircraft, async(req,res) => {
        if(req.body.fileid){
            file.findOne({where: { file_uid: req.body.fileid }}).then((data) => {
                res.send(data);
            })
        } else {
            res.status(500).send('Missing input data: you provided' + req.body);
        }
    });

    app.get('/api/image/:id', async(req,res) => {
        console.log(req.query);
        const fileID = req.params.id;
        if(fileID){
            Files.findOne({where: { file_uid: fileID }}).then((data) => {
                if(data){
                        var base64Data = data.b64.toString().replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
                        var img = Buffer.from(base64Data, 'base64');
                        res.writeHead(200, {
                            'Content-Type': 'image/png',
                            'Content-Length': img.length
                        });
                        res.end(img); 
                } else {
                    res.sendStatus(404);
                }
            });
        } else {
            res.sendStatus(404);
        }
    });

    //get all maintenance logs by aircraft ID
    app.get('/api/mlog/:aircraftID', authenticateToken, async(req,res) => {
        const aircraftID = req.params.aircraftID;
        mlog.findAll({ where: { plane_id: aircraftID }}).then((data) => {
            res.send(data);
        })
    });
    
    app.get('/api/mlog_files/:mlogID', authenticateToken, async(req,res) => {
        const mlogID = req.params.mlogID;
        let mlog = {};
        mlog_files.findAll({ where: { mlog_id : mlogID } }).then((data) => {
            res.send(data);
        });
    });

    app.post('/api/mlog/create/:plane/:name', authenticateToken, async(req,res) => {
        mlog.create({ name: req.params.name, plane_id: req.params.plane}).then((data) => {
            res.send(data);
        });
    });
    

    app.post('/api/mlog/add/:fileid/:mlogid', authenticateToken, async(req,res) => {
        mlog_files.create({ mlog_id: req.params.mlogid, file_id: req.params.fileid }).then((data) => {
            res.send(data);
        })
    })

    //DELETE a document
    //req.body.tail
    //req.body.fileid
    app.post('/api/file/delete', authenticateToken, isUserAccessingOwnAircraft, async(req, res) => {
        if(req.body.tail && req.body.fileid){
            file.destroy({ where: { linked_aircraft_tail: req.body.tail, file_uid: req.body.fileid }}).then((data) => {
                res.send(data);
            })
        } else {
            res.status(500).send('Missing input data: you provided' + req.body);
        }
    });

    app.get('/api/user/get/assignedaircraft/details/:id', authenticateToken, isUserAccessingOwnAccount, async (req, res) => {
        try {
            const { id } = req.params;
    
            const plane = await Planes.findOne({ where: { id: id } });
    
            if (!plane) {
                return res.status(404).send('Plane not found');
            }
    
            console.log(Files);
            const filesCount = await Files.count({ where: { linked_aircraft_id: id } });
    
            plane.dataValues.filesCount = filesCount;
    
            res.status(200).send(plane);
        }
        catch (error) {
            console.error(error);
            res.status(500).send('An error occurred while retrieving the plane information.');
        }
    });


    app.post('/api/ocr', authenticateToken, async (req, res) => {
        try {
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
        } catch (e) {
            console.log(e);
        }
       
   
    });

    /* END Blob POST */



}

module.exports = {
    startExternalRoutes: startExternalRoutes
}