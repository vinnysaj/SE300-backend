const { Sequelize, DataTypes } = require("sequelize");
const sequelize = new Sequelize(process.env.postgre_login, {logging: false});

sequelize.authenticate().then(() => {
}).catch((error) => {
  console.error('Unable to connect to the database: ', error);
});


const file = sequelize.define("file", {
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    mimetype: {
        type: DataTypes.STRING,
        allowNull: false
    },
    file_uid: { 
        type: DataTypes.STRING,
        allowNull: false
    },
    b64: {
        type: DataTypes.BLOB,
        allowNull: true
    },
    user_id_uploaded: {
        type: DataTypes.STRING,
        allowNull: false
    },
    timestamp: {
        type: DataTypes.STRING,
        allowNull: false
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false
    },
    linked_aircraft_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    hand_written: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
    title: {
        type: DataTypes.STRING,
        allowNull: true
    },
    parsed_content: {
        type: DataTypes.JSON,
        allowNull: true
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true
    },
    order: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
});


module.exports = {
    files: file
}