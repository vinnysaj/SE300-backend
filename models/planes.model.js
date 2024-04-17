const { Sequelize, DataTypes } = require("sequelize");
const sequelize = new Sequelize(process.env.postgre_login, {logging: false});

sequelize.authenticate().then(() => {
}).catch((error) => {
  console.error('Unable to connect to the database: ', error);
});

const Planes = sequelize.define("planes", {
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    friendly_name: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    tail:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    active:{
        type: DataTypes.BOOLEAN,
        allowNull: true
    },
    serial:{
        type: DataTypes.STRING,
        allowNull: true
    },
    icao:{
        type: DataTypes.STRING,
        allowNull: true
    },
    model:{
        type: DataTypes.STRING,
        allowNull: true
    },
    typeName:{
        type: DataTypes.STRING,
        allowNull: true
    },
    regowner:{
        type: DataTypes.STRING,
        allowNull: true
    },
    hours:{
        type: DataTypes.INTEGER,
        allowNull: true
    },
    plane_data:{
        type: DataTypes.JSON,
        allowNull: true
    },
    owner_id:{
        type: DataTypes.STRING,
        allowNull: true
    },
    icon_file_b64: {
        type: DataTypes.STRING,
        allowNull: true
    },
    cover_file_b64: {
        type: DataTypes.STRING,
        allowNull: true
    },
    mileage: {
        type: DataTypes.DOUBLE,
        allowNull: true
    },
    lastLogDate: {
        type: DataTypes.STRING,
        allowNull: true
    }
});



module.exports = {
    Planes : Planes
}

