'use strict'

/******************************************************************************************************** */
/**																																																				*/
/**		Requerimientos de modulos de terceros y locales.																									 	*/
/**																																																				*/
/******************************************************************************************************** */

const express = require('express');
const ws = 			require('./socketio/index');
const http = 		require('http');
const GLBL = 		require('./config/general');
const Axapta = 	require('./services/Axapta');



/**********************************************************************************************************/
/**																																																				*/
/** 	Guardamos en la variable "app" la instancia de la aplicación express																*/
/**																																																				*/
/**********************************************************************************************************/

const app = express();



/**********************************************************************************************************/
/**																																																				*/
/** 	Permite gestion de objetos JSON a la aplicacion, si la peticion es POST o PUT												*/
/**																																																				*/
/**********************************************************************************************************/

app.use(express.json());



/**********************************************************************************************************/
/**																																																				*/
/** 	En la variable "server" creamos el servidor pasando como parametro el modulo 												*/
/**		"express" instanciado en la variable "app"																													*/
/**																																																				*/
/**********************************************************************************************************/

const server = http.createServer(app);



/**********************************************************************************************************/
/**																																																				*/
/** 	Llamamos a SOCKET.IO	'./socketio/index.js' pasando como parametro el servidor creado								*/
/**																																																				*/
/**********************************************************************************************************/

ws.Socket_IO(server);




/**********************************************************************************************************/
/**																																																				*/
/** 	Establece comunicacion con base de datos Axapta																											*/
/**																																																				*/
/**********************************************************************************************************/

Axapta.Conectar();



/**********************************************************************************************************/
/**																																																				*/
/** 	Levantamos el servidor escuchando el puerto ${}, [ Variable Global en config/index.js]							*/
/**																																																				*/
/**********************************************************************************************************/

server.listen(GLBL.PORT, () => {
	log.info(`Servidor iniciat i escoltant en el port: ${GLBL.PORT} | http://localhost:${GLBL.PORT}`);
})