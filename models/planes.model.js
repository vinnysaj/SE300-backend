const { Sequelize, DataTypes } = require("sequelize");
const sequelize = new Sequelize(process.env.postgre_login, {logging: false});

sequelize.authenticate().then(() => {
}).catch((error) => {
  console.error('Unable to connect to the database: ', error);
});

const Planes = sequelize.define("Planes", {
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    reg:{
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
        type: DataTypes.JSON,
        allowNull: true
    }


});

module.exports = {
    Planes : Planes
}

