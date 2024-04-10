require('dotenv').config();

const { Sequelize, Model, DataTypes } = require('sequelize');

const sequelize = new Sequelize(process.env.DB_NAME, process.env.USER, process.env.PASSWORD, {
  host: process.env.HOST,
  dialect: 'postgres',
});

class Planes extends Model {}

Planes.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  flight: DataTypes.TEXT,
  squawk: DataTypes.TEXT,
  hex: DataTypes.TEXT,
  alt_geom: DataTypes.TEXT,
  alt_baro: DataTypes.TEXT,
  gs: DataTypes.REAL,
  track: DataTypes.REAL,
  baro_rate: DataTypes.REAL,
}, { sequelize, modelName: 'Planes' });

module.exports = Planes;
