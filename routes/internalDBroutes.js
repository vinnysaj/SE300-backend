const Users = require(__dirname + "./../models/users.model.js").Users;
function startInternal(app2){

//************************INTERNAL SERVER FOR LOCAL DB ACCESS**************************************/  
app2.post('/getUserByEmail', async (req,res) => {

    app2.set('view engine', 'pug');
    app2.set('views', './internal_routes');

    const reqUser = await Users.findOne({
        where: {
            email: req.body.email
        }
    })
    if(reqUser === null ){
        res.send("NULL");
    } else {
        res.send(reqUser);
    }
})

app2.post('/getUserByID', async (req,res) => {
    const reqUser = await Users.findOne({
        where: {
            user_id: req.body.id
        }
    })
    if(reqUser === null){
        res.send("NULL");
    } else {
        res.send(reqUser);
    }
    
})

app2.post('/updateUserPhoneNumber', async(req,res) => {
    const reqUser = await Users.update({ phone_number: req.body.phone_number }, {
        where: {
          user_id: req.body.user_id
        }
      });
    res.send(reqUser);
})

app2.post('/getPlanes', async(req,res) => {
    console.log(req.body.user_id);
    const reqUser = await Users.findOne({ where : { user_id: req.body.user_id }});
    if(reqUser === null) {
        res.send("NULL");
    } else {
         res.send(reqUser.planes);
    }
})

app2.post('/updatePlanes', async(req,res) => {
    const reqUser = await Users.update({ planes: req.body.planes }, { where: { user_id: req.body.user_id }});
    res.send(reqUser);
})

app2.post('/isNewUser', async(req,res) => {
    const reqUser = await Users.findOne({ where: { user_id: req.body.user_id}});
    if(reqUser === null){
        res.send("NULL");
    } else {
        res.send(reqUser.is_new_user);
    }
})

app2.post('/noLongerNewUser', async(req,res) => {
    const reqUser = await Users.update({is_new_user: false}, {
        where: {
            user_id: req.body.user_id
        }
    });
    res.send(reqUser);
})

app2.get('/debugUserNotFound', (req,res) => {
    var user_id = req.param('userid');
    res.render('debugUserNotFound', { user_id: user_id });
})

app2.get('/debugUser', async(req,res) => {
    var userid = null;
    if(req.query.userid != null){
        userid = req.query.userid;
    } else {
        var chrisID = '106128017282493053284';
        userid = chrisID;
    }
    const reqUser = await Users.findOne({where: { user_id : userid }});
    if(reqUser === null) {
        res.redirect('/debugUserNotFound?userid=' + userid);
    } else {
        res.render('debugUsers', { user_id: userid, isNewUser: reqUser.is_new_user, name: reqUser.name, email: reqUser.email, phone_number: reqUser.phone_number, planes: reqUser.planes, isadmin: reqUser.admin});
    }
})

app2.post('/debugUserPostNewData', async(req,res) => {
    var isNewUser = false;
    var isadmin = false;
    if(req.body.is_new_user == "on"){
        isNewUser = true;
    }
    if(req.body.is_admin == "on"){
        isadmin = true;
    }
    
    const reqUser = await Users.update({ 
        is_new_user: isNewUser,
        name: req.body.name,
        phone_number: req.body.phone_number,
        planes: req.body.planes,
        admin: isadmin
     }, {where: {
        user_id: req.body.user_id
     }})
     if(reqUser[0] == 1){
        res.redirect('/debugUser?userid=' + req.body.user_id);
     } else {
        res.send("INTERNAL SERVER ERROR");
     }
});


async function fetchAllUserID(){
    const reqUsr = await Users.findAll();

}   

}




module.exports = {startInternal : startInternal}