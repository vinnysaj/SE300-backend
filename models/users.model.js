const { Sequelize, DataTypes } = require("sequelize");
const sequelize = new Sequelize(process.env.postgre_login, {logging: false});

sequelize.authenticate().then(() => {
  }).catch((error) => {
    console.error('Unable to connect to the database: ', error);
  });

const Users = sequelize.define("users", {
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    is_new_user: {
         type: DataTypes.BOOLEAN,
         allowNull: false
    },
    token: {
        type: DataTypes.STRING(1024),
        allowNull: true
    },
    user_id: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    nickname: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    email: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    phone_number:{
        type: DataTypes.STRING(25),
        allowNull: true
    },
    planes: {
        type: DataTypes.JSON,
        allowNull: true
    },
    admin: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    profile_image: {
      type: DataTypes.STRING,
      allowNull: true
    }


  })



module.exports = {
    Users : Users
}


//only for initial creation
//Users.sync({ force: true});