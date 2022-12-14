'use strict'

/******************************************************************************************************** */
/**																																																				*/
/**		Requerimientos de modulos de terceros y locales.																									 	*/
/**																																																				*/
/**		GLBL: 			Archivo de configuracion de la aplicacion																								*/
/**																																																				*/
/******************************************************************************************************** */
const { APP, SERVER, ESTADOS } = require('../config/index');
const { datosVerificacion } = require('../models/index');
const { ListadoVerificadores } = require('../models/usersSQL');






let Socket_IO = (server) => {

/**********************************************************************************************************/
/**																																																				*/
/** 	Se crea una nueva instancia de socket.io pasando como parametro el servidor http o (https)					*/
/**																																																				*/
/**		Params:																																															*/
/**			server [Object]																																										*/
/**																																																				*/
/**********************************************************************************************************/
	
	let io = require('socket.io')(server, {
		cors: {
			origin: '*',
			methods: ['GET', 'POST'],
		}
	});



/**********************************************************************************************************/
/**																																																				*/
/** 	Escucha las peticiones entrantes de cliente "socket" contiene la info necesaria para responder			*/
/**																																																				*/
/**********************************************************************************************************/
	
	io.on('connection', (socket) => {

		let numSockets = io.engine.clientsCount;
		let verificacionEnCurso = datosVerificacion.getData('/');


		console.log('Socket conectado: ' + socket.id + '  |  Total sockets conectados: ' + numSockets);
		



		/******************************************************************************************************/
		/**																																																		*/
		/** 	Enviamos al cliente informaci??n del servidor, SO y network, adem??s si en la variable global			*/
		/**		GLBL.APP.operario == '', pedimos al cliente que envie los datos del usuario autenticado.			 	*/
		/**																																																		*/
		/******************************************************************************************************/

		socket.emit('infoServer', {
			'os': os.arch(),
			'hostname': os.hostname(),
			'network': os.networkInterfaces(),
			'upTime': os.uptime(),
			'name': SERVER.nomVerificadorAutomatic,
			'version': SERVER.version,
			'nameDatabase': SERVER.configSQL.database,
			'serverDatabase': SERVER.configSQL.server,
			'versionDatabase': SERVER.configSQL.options.tdsVersion,
			'usuario': APP.operario === '' ? true : false
		});






		/******************************************************************************************************/
		/**																																																		*/
		/** 	Enviamos al cliente peticion de nombre de usuario																								*/
		/**																																																		*/
		/******************************************************************************************************/

		APP.operario === '' ? socket.emit('peticionDatosUsuario') : '';






		/******************************************************************************************************/
		/**																																																		*/
		/**		Al conectarse un nuevo socket:																																	*/
		/**			comprueba si existe una verificaci??n en curso																									*/
		/** 			La verificacion esta corriendo?, 																														*/
		/**					Si: 										 																																	*/
		/**						numero de sockets === 1?																																*/
		/**							Si: Pasamos datos verificaci??n al cliente y lo redirigimos a p??gina de verificaci??n		*/
		/**							No: redirigimos al cliente a p??gina solo ver valores y datos del equipo								*/
		/** 																																																	*/
		/**					No: 																																						 					*/
		/**						numero de sockets === 1?																																*/
		/**							Si: Pasamos datos verificaci??n al cliente y lo redirigimos a p??gina de verificaci??n		*/
		/**									establecemos en TRUE la variable global APP.runLoop	y llamamos a la funci??n				*/
		/**																																																		*/
		/**							No: redirigimos al cliente a p??gina solo ver valores y datos del equipo								*/
		/**				Si: requerimos al cliente que se autentifique.																						 	*/
		/**																																																		*/
		/******************************************************************************************************/

		if (Object.keys(verificacionEnCurso).length >= 1) {

			if (APP.runLoop) { // Delimita si el que haya una nueva conexion socket ha sido por caida del serviddor, ()TRUE = nuevo socket, FALSE = caida server)
				if (numSockets === 1) {
					socket.emit('pageStart', verificacionEnCurso);  // Enviamos primero la orden para que se desplace a la pagina start
				} else {
					socket.emit('valores', verificacionEnCurso);
				}
			} else {
				if (numSockets === 1) {
					GLBL.APP.EjecucionActiva = true;
					comunicacionEquipo.comunicar(io);
					socket.emit('pageStart', verificacionEnCurso);  // Enviamos primero la orden para que se desplace a la pagina start
				} else {
					socket.emit('valores', verificacionEnCurso);  // Enviamos primero la orden para que se desplace a la pagina start
				}
			}
		}
		




		/******************************************************************************************************/
		/**																																																		*/
		/**		Socket se conecte, enviamos datos de verificadores y de maquinas y 															*/
		/**		refrigerantes cuando no haya conexion con Axapta.  [ver modulo para mas info]										*/
		/**																																																		*/
		/******************************************************************************************************/

		ListadoVerificadores((datos) => {
				socket.emit('dadesGenerals', {
					estats: ESTADOS,
					verificadors: datos,
					refrigerants: datosSinConexion.getData('/refrigerants'),
					equips: datosSinConexion.getData('/equips'),
				});
			});
		








	
		socket.on('datosEquipo', (datos) => { });

		

	});


}

module.exports = {
	Socket_IO: Socket_IO
}