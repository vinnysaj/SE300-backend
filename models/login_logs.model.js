const { Sequelize, DataTypes } = require("sequelize");
const sequelize = new Sequelize('postgres://se300:se300@127.0.0.1:5432/se300database', {logging: false});

sequelize.authenticate().then(() => {
  }).catch((error) => {
    console.error('Unable to connect to the database: ', error);
  });


const login_logs = sequelize.define("login_logs", {
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.STRING(100)
    },
    ip_address: {
        type: DataTypes.STRING(100)
    }
})

//login_logs.sync({ force: true});

module.exports = {
    login_logs : login_logs
}