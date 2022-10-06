'use strict'

// Requeriments de depencencies
const GLBL = require('./config/index');
const { dbA } = require('./models/bbdd');
const { setVars } = require('./serveis/accionesCurl');



let io;

let Socket_IO = (server) => {
	io = require('socket.io')(server, {
		cors: {
			origin: '*',
			methods: ['GET', 'POST'],
		}
	});

	io.on('connection', (socket) => {

	
		socket.on('datosEquipo', (datos) => { 
			GLBL.EQUIPO.numeroSerie = datos.numeroSerie;
			GLBL.EQUIPO.modelo = datos.modelo;
			GLBL.EQUIPO.potenciaFrigorica = datos.potenciaFrigorica;
		});

		

	});


}

module.exports = {
	Socket_IO: Socket_IO
}