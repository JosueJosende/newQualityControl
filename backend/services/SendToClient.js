'use strict'



/******************************************************************************************************/
/**																																																		*/
/**																																																		*/
/******************************************************************************************************/

let sockets;
let socket;

module.exports.setSocket = (sckt, sckts) => {
	socket = sckt;
	sockets = sckts;
}









/******************************************************************************************************/
/**																																																		*/
/**																																																		*/
/******************************************************************************************************/

module.exports.toClient = (evento, datos, sckts = null) => {

	if (sckts) {
		sockets.emit(evento, datos);
	} else {
		socket.emit(evento, datos);
	}
}