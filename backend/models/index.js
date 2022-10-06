'use strict'

// Requeriments de depencencies
const GLBL = require('../config/index');
const { JsonDB } = require('node-json-db');
const { Config } = require('node-json-db/dist/lib/JsonDBConfig');



/** ********************************************************************************* **/
/*
/*
/*
/** ********************************************************************************* **/

let CrearNuevo = (server) => {
	let dbFin = new JsonDB(new Config('./ensayos/' + GLBL.EQUIPO.modelo + '-' + GLBL.EQUIPO.potencia + '_' + GLBL.numeroSerie, true, false, '/'));
	try {
		dbFin.push('/', datos);
	} catch (err) {
		console.log('Ocurrio un error al guardar la verificacion en finalizadas: ', err);
	}
}




/** ********************************************************************************* **/
/*
/*
/*
/** ********************************************************************************* **/
let Cargar = (ensayo) => {
	module.exports.ENSAYO = new JsonDB(new Config(ensayo, true, false, '/'));
}


let Ensayo = new JsonDB(new Config('./MB2C', true, false, '/'));	


module.exports.CrearNuevo = CrearNuevo;
module.exports.ENSAYO = Ensayo;