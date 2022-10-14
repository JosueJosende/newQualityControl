'use strict'

/******************************************************************************************************** */
/**																																																				*/
/**		Requerimientos de modulos de terceros y locales.																									 	*/
/**																																																				*/
/**		GLBL: 			Archivo de configuracion de la aplicacion																								*/
/**																																																				*/
/******************************************************************************************************** */
const GLBL = require('./config/index');



let io;

let Socket_IO = (server) => {

/**********************************************************************************************************/
/**																																																				*/
/** 	Se crea una nueva instancia de socket.io pasando como parametro el servidor http o (https)					*/
/**																																																				*/
/**		Params:																																															*/
/**			server [Object]																																										*/
/**																																																				*/
/**********************************************************************************************************/
	
	io = require('socket.io')(server, {
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

	
		socket.on('datosEquipo', (datos) => { });

		

	});


}

module.exports = {
	Socket_IO: Socket_IO
}