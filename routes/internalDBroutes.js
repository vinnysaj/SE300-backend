const Users = require(__dirname + "./../models/users.model.js").Users;
const Planes = require(__dirname + "./../models/planes.model.js").Planes;
const DebugAPI = require(__dirname + "./../lib/aircraftLookup.js");
const JSONbig = require('json-bigint');

function startInternal(app2) {

    //************************INTERNAL SERVER FOR LOCAL DB ACCESS**************************************/  

    app2.get('/debugAssignUserAircaft', async (req,res) => {
        res.sendStatus(404);
    });

    app2.get('/debugNewAircraft', async (req, res) => {
        res.render('debugNewAircraftForm');
    });

    app2.get('/debugAllAircraft', async (req, res) => {
        try {
            const planes = await Planes.findAll();
            const planePromises = planes.map(async (plane) => {
                if (plane.owner_id != null) {
                    // added this check to fix an issue where "" may appear in the database and makes our lives miserable
                    if(plane.owner_id.length > 4){
                        const numeric = JSONbig.parse(plane.owner_id.toString()).owner_id[0].toString();
                        plane.owner_id = JSONbig.parse(plane.owner_id.toString()).owner_id[0];
                        const user = await Users.findOne({
                            where: {
                                user_id: numeric
                            }
                        });
                        if (user) {
                            plane.owner_name = user.name;
                        }
                    }
                }
                return plane;
            });

            const modifiedPlanes = await Promise.all(planePromises);
            res.render('debugAllAircraft', {
                airplanes: modifiedPlanes
            });
        } catch (error) {
            console.error("Error in /debugAllAircraft:", error);
            res.status(500).send("An error occurred while processing your request.");
        }
    });

    app2.get('/debugAllusers', async (req, res) => {
        const allUsers = await Users.findAll({});
        res.render('debugAllUsers', {
            users: allUsers
        });
    })

    app2.post('/debugNewAircraft', async (req, res) => {
        DebugAPI.pullNewAircraft(req.body.tail_number, async (returns) => {
            if (returns === null) {
                res.redirect('/debugNewAircraft?error=' + req.body.tail_number);
            } else {
                const reqPlane = await Planes.findOne({
                    where: {
                        reg: req.body.tail_number
                    }
                });
                if (reqPlane === null) {
                    //no plane in system lets make one.
                    Planes.create({
                        reg: req.body.tail_number,
                        active: returns.data.active,
                        serial: returns.data.serial,
                        icao: returns.data.hexIcao,
                        regowner: returns.data.airlineName,
                        model: returns.data.model,
                        typeName: returns.data.typeName,
                        hours: 0
                    });
                    res.redirect('/debugAircraft?tail_number=' + req.body.tail_number);
                } else {
                    //TODO ADD FORCE OPTION TO OVERWRITE HERE
                    //plane in system, redirect back to /debugAicraft?aircraft=tail_number
                    res.redirect('/debugAircraft?tail_number=' + req.body.tail_number);
                }
            }
        });

    })

    app2.get('/debugAircraft', async (req, res) => {
        if (req.query.tail_number == null) {
            res.render('debugAircraft');
        } else {
            const reqAircraft = await Planes.findOne({
                where: {
                    reg: req.query.tail_number
                }
            }).then((data) => {
                if (data === null) {
                    res.redirect('/debugAircraft?error=' + req.query.tail_number);
                } else {
                    res.render('debugAircraft', {
                        tail_number: req.query.tail_number,
                        plane_id: data.id,
                        icao: data.icao,
                        typeName: data.typeName,
                        hours: data.hours,
                        owner_id: data.owner_id,
                        serial: data.serial,
                        model: data.model,
                        regOwner: data.regowner,
                        plane_data: data.plane_data,
                        active: data.active
                    });
                }
            })
        }
    })

    app2.post('/debugAircraft', async (req, res) => {
        var isActive = false;
        var hours = 0;
        if (!(req.body.hours < 0 || req.body.hours == "" || req.body.hours == null)) {
            hours = req.body.hours;
        }
        if (req.body.active == 'on') {
            isActive = true
        }
        try {
            Planes.update({
                tail_number: req.body.tail_number,
                active: isActive,
                serial: req.body.serial,
                icao: req.body.icao,
                model: req.body.model,
                typeName: req.body.typeName,
                regowner: req.body.regOwner,
                hours: hours,
                plane_data: req.body.plane_data,
                owner_id: req.body.owner_id
            }, {
                where: {
                    id: req.body.id
                }
            }).then(() => {
                res.redirect('/debugAircraft?tail_number=' + req.body.tail_number);
            })
        } catch (error) {
            console.error(error);
        }
    });



    app2.get('/debug', async (req, res) => {
        res.render('debugMain');
    });


    app2.post('/getUserByEmail', async (req, res) => {

        app2.set('view engine', 'pug');
        app2.set('views', './internal_routes');

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

    app2.post('/getUserByID', async (req, res) => {
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

    app2.post('/updateUserPhoneNumber', async (req, res) => {
        const reqUser = await Users.update({
            phone_number: req.body.phone_number
        }, {
            where: {
                user_id: req.body.user_id
            }
        });
        res.send(reqUser);
    })

    app2.post('/getUserAssignedAircraft', async (req, res) => {
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

    app2.post('/getAircraftByTail', async(req,res) => {
        Planes.findOne({where:{reg: req.body.tail}}).then((plane) => {
            if(plane != null){
                res.send(plane);
            } else {
                res.send(null);
            }
        });
    });

    app2.post('/updateUserAssignedAircraft', async (req, res) => {
        const reqUser = await Users.update({
            planes: req.body.planes
        }, {
            where: {
                user_id: req.body.user_id
            }
        });
        res.send(reqUser);
    })

    app2.post('/getAllAircraft', async(req,res) => {
        Planes.findAll().then((planes) => {
            res.send(planes);
        });
    });

    

    app2.post('/isNewUser', async (req, res) => {
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

    app2.post('/noLongerNewUser', async (req, res) => {
        const reqUser = await Users.update({
            is_new_user: false
        }, {
            where: {
                user_id: req.body.user_id
            }
        });
        res.send(reqUser);
    })

    app2.get('/debugUserNotFound', (req, res) => {
        var user_id = req.query.userid;
        res.render('debugUserNotFound', {
            user_id: user_id
        });
    })

    app2.get('/debugUser', async (req, res) => {
        if (req.query.userid) {
            var userid = null;
            if (req.query.userid != null) {
                userid = req.query.userid;
            } else {
                var chrisID = '106128017282493053284';
                userid = chrisID;
            }
            const reqUser = await Users.findOne({
                where: {
                    user_id: userid
                }
            });
            if (reqUser === null) {
                res.redirect('/debugUserNotFound?userid=' + userid);
            } else {
                res.render('debugUsers', {
                    user_id: userid,
                    isNewUser: reqUser.is_new_user,
                    name: reqUser.name,
                    email: reqUser.email,
                    phone_number: reqUser.phone_number,
                    planes: reqUser.planes,
                    isadmin: reqUser.admin
                });
            }
        } else {
            res.render('debugUsers');
        }
    })


    app2.post('/debugUserPostNewData', async (req, res) => {
        var isNewUser = false;
        var isadmin = false;
        if (req.body.is_new_user == "on") {
            isNewUser = true;
        }
        if (req.body.is_admin == "on") {
            isadmin = true;
        }

        const reqUser = await Users.update({
            is_new_user: isNewUser,
            name: req.body.name,
            phone_number: req.body.phone_number,
            planes: req.body.planes,
            admin: isadmin
        }, {
            where: {
                user_id: req.body.user_id
            }
        })
        if (reqUser[0] == 1) {
            res.redirect('/debugUser?userid=' + req.body.user_id);
        } else {
            res.send("INTERNAL SERVER ERROR");
        }
    });

    app2.post('/getUserAssignedAircraftFormatted', async (req, res) => {
        if (req.body.user_id != null) {
            try {
                const user = await Users.findOne({ where: { user_id: req.body.user_id } });
                if (user) {
                    const assignedPlanes = JSON.parse(user.planes).planes;
                    let formattedList = [];
    
                    for (const planeid of assignedPlanes) {
                        const plane = await Planes.findOne({ where: { reg: planeid } });
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
    
    app2.post('/updateAircraftHours', async (req,res) => {
        if(req.body.tail != null && req.body.hours != null){
            try {
                Planes.update({where: { reg:  req.body.tail}}, { hours: req.body.hours }).then((data) => {
                    res.send(data)
                })
            } catch (error) {
                res.status(500).send('Server Error');
            }
        } else {
            res.sendStatus(400); 
        }
    });

}




module.exports = {
    startInternal: startInternal
}