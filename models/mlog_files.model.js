const { Sequelize, DataTypes } = require("sequelize");
const sequelize = new Sequelize(process.env.postgre_login, {logging: false});

sequelize.authenticate().then(() => {
}).catch((error) => {
  console.error('Unable to connect to the database: ', error);
});


const mlog_files = sequelize.define("mlog_files", {
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    mlog_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    }, 
    file_id: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

//mlog_files.sync({ force: true});

module.exports = {
    mlog_files : mlog_files
}