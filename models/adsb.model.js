const { Sequelize, DataTypes } = require("sequelize");
const sequelize = new Sequelize(process.env.postgre_login, {logging: false});

sequelize.authenticate().then(() => {
}).catch((error) => {
  console.error('Unable to connect to the database: ', error);
});


const adsb = sequelize.define("adsb", {
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    tail: {
        type: DataTypes.STRING,
        allowNull: false
    },
    flight_id: { 
        type: DataTypes.STRING,
        allowNull: false
    },
    trip_explained: {
        type: DataTypes.STRING,
        allowNull: false
    },
    distance: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    departtime: {
        type: DataTypes.STRING,
        allowNull: false
    },
    arrivetime: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    timestamps: false,
    tableName: 'adsb'
});

//only for initial creation
//adsb.sync({ force: true});

module.exports = {
    adsb: adsb
}