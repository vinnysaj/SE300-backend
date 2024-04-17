const { Sequelize, DataTypes } = require("sequelize");
const sequelize = new Sequelize(process.env.postgre_login, {logging: false});

sequelize.authenticate().then(() => {
}).catch((error) => {
  console.error('Unable to connect to the database: ', error);
});


const mlog = sequelize.define("mlog", {
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    }, 
    plane_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
});

//mlog.sync({ force: true});

module.exports = {
    mlog : mlog
}