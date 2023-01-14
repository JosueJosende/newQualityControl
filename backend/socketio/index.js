'use strict'

/******************************************************************************************************** */
/**																																																				*/
/**		Requerimientos de modulos de terceros y locales.																									 	*/
/**																																																				*/
/**		GLBL: 			Archivo de configuracion de la aplicacion																								*/
/**																																																				*/
/******************************************************************************************************** */
const { APP, SERVER, ESTADOS, VERIFICACION } = require('../config/index');
const { datosVerificacion } = require('../models/index');
const { ListadoVerificadores, Autenticacion } = require('../models/usersSQL');
const { setSocket } = require('../services/SendToClient');








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


		APP.debug ? console.log('Socket conectado: ' + socket.id + '  |  Total sockets conectados: ' + numSockets) : '';



		// El primer socket conectado será el master con lo que las respuestas de accion solo se le enviaran
		// a este, las respuestas de información se les enviará a todos los sockets conectados.

		// !!!! A tener en cuenta, cuando el master se desconecte y haya otros sockets conectados !!!!
		numSockets === 1 ? setSocket(socket, io) : '';
		



		/******************************************************************************************************/
		/**																																																		*/
		/** 	Enviamos al cliente información del servidor, SO y network, además si en la variable global			*/
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
		/** 	Enviamos al cliente peticion de nombre de usuario, esperando respuesta por medio								*/
		/** 	del oyente 'datosUsuario'																																				*/
		/**																																																		*/
		/**		Esta lógica trabaja en la sombra, todo lo hace sin que interactue el usuario										*/
		/**																																																		*/
		/******************************************************************************************************/

		APP.operario === '' ? socket.emit('peticionDatosUsuario') : '';

		// Almacenamos en la variable global los datos recibidos del usuario autentificado
		socket.on('datosUsuario', (datosUsuario) => { APP.operario = datosUsuario } );






		/******************************************************************************************************/
		/**																																																		*/
		/**		Al conectarse un nuevo socket:																																	*/
		/**			comprueba si existe una verificación en curso																									*/
		/** 			La verificacion esta corriendo?, 																														*/
		/**					Si: 										 																																	*/
		/**						numero de sockets === 1?																																*/
		/**							Si: Pasamos datos verificación al cliente y lo redirigimos a página de verificación		*/
		/**							No: redirigimos al cliente a página solo ver valores y datos del equipo								*/
		/** 																																																	*/
		/**					No: 																																						 					*/
		/**						numero de sockets === 1?																																*/
		/**							Si: Pasamos datos verificación al cliente y lo redirigimos a página de verificación		*/
		/**									establecemos en TRUE la variable global APP.runLoop	y llamamos a la función				*/
		/**																																																		*/
		/**							No: redirigimos al cliente a página solo ver valores y datos del equipo								*/
		/**				Si: requerimos al cliente que se autentifique.																						 	*/
		/**																																																		*/
		/******************************************************************************************************/

		if (Object.keys(verificacionEnCurso).length >= 1) {

			if (VERIFICACION.RunLoop) { // Delimita si el que haya una nueva conexion socket ha sido por caida del serviddor, ()TRUE = nuevo socket, FALSE = caida server)
				if (ESTADOS.EstadoEquipo) {
					if (numSockets === 1) {
						socket.emit('sendStart', verificacionEnCurso);  // Enviamos primero la orden para que se desplace a la pagina start
					} else {
						socket.emit('sendValues', verificacionEnCurso);
					}
				} else {
					APP.debug ? (console.log({
						NumSockets: numSockets,
						Descripcion: 'Detectada verificación en curso, pero sin comunicación con el equipo',
						origen: './socketio/index.js <-- ctrl+g(120)'
					}) ) : '';
				}
			} else {
				if (numSockets === 1) {
					VERIFICACION.RunLoop = true;
					VERIFICACION.SoftInstalado = true;
					VERIFICACION.TiemposGuardados = true;
					VERIFICACION.TiemposModificados = true;
					VERIFICACION.SetDatosVerificacion = true;
					VERIFICACION.SetTrazabilidad = true;

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
		








	
		socket.on('authentication', (datosAuth) => Autenticacion(datosAuth));

		socket.on('getEquip', (datosEquipo) => EquipController.getEquip(datosEquipo) );
		socket.on('setEquip', (datosEquipo) => EquipController.setEquip(datosEquipo) );

		

	});


}

module.exports = {
	Socket_IO: Socket_IO
}