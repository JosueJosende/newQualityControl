'use strict'

/******************************************************************************************************** */
/**																																																				*/
/**		Requerimientos de modulos de terceros y locales.																									 	*/
/**																																																				*/
/**		GLBL [SERVER, APP, ESTADOS]: 	Configuracion de la aplicacion																				*/
/**		Connection:   |																																											*/
/**		Request: 		<|  Conexión con Axapta				  																												*/
/**		TYPES: 			 |																																											*/
/**																																																				*/
/******************************************************************************************************** */

const { SERVER, APP, ESTADOS } = require('../config/globals');
const Connection = require('tedious').Connection;
const Request = require('tedious').Request;
const TYPES = require('tedious').TYPES;

const config = SERVER.configSQL





/******************************************************************************************************** */
/**																																																				*/
/**		Almacen de la instancia de conexión a la base de datos																							*/
/**																																																				*/
/******************************************************************************************************** */

let connection;





/******************************************************************************************************** */
/**																																																				*/
/**		Llamada a la funcion de conexion a la base de datos y escucha de eventos.														*/
/**																																																				*/
/**		@param: socket --> emite evento al cliente informando 																							*/
/**																																																				*/
/******************************************************************************************************** */

const Conectar = (socket) => {
	connection = new Connection(config);
	connection.connect(Connected);
}





/******************************************************************************************************** */
/**																																																				*/
/**		Funcion que desconecta la base de datos.																														*/
/**																																																				*/
/**		@param: socket --> emite evento al cliente informando 																							*/
/**																																																				*/
/******************************************************************************************************** */

const Desconectar = (socket) => {
	connection.close();
}








connection.on('infoMessage', (info) => console.log(info.number + ' : ' + info.message));
connection.on('errorMessage', (info) => console.log(info.number + ' : ' + info.message));
connection.on('end', () => ESTADOS.EstadoAxapta = false );
connection.on('debug', debug);
connection.on('error', () => console.log('ERROR: Se Perdio la comunicación') );






/******************************************************************************************************** */
/**																																																				*/
/**		Conexion a la base de datos																																					*/
/**																																																				*/
/******************************************************************************************************** */

const Connected = ((err) => {
	if (err) {
    console.log(err);
		ESTADOS.EstadoAxapta = false;
		ESTADOS.InfoAxapta = 'Desconectado';



		/**************************************************************************************************** */
		/**																																																		*/
		/**		Si hay error en la conexió a la BBDD, cada 30" intentará reconectar la conexion.						 	 	*/
		/**																																																	 	*/
		/**************************************************************************************************** */
		
		setTimeout(() => {
			ESTADOS.EstadoAxapta = 'Reconectando';
			Conectar();
			console.log('*** Reintentando reconectar con la BBDD, Axapta ***');
		}, 30000);
	}
	
	console.log('*** Conexión establecida BBDD, Axapta ***');
	ESTADOS.EstadoAxapta = true;
	ESTADOS.InfoAxapta = 'Establecida';
});





/******************************************************************************************************** */
/**																																																				*/
/**		Añade al array los parametros necesarios para realizar la consulta SQL a la base de datos 				 	*/
/**		de Axapta.																																													*/
/**																																																				*/
/******************************************************************************************************** */

const BuildParams = (params, name, type, value) => {
	params.push({
		name: name,
		type: type,
		value: value
	});
};





/******************************************************************************************************** */
/**																																																				*/
/**		Realiza la consulta a la base de datos y devuelve los resultados.																	 	*/
/**																																																				*/
/**		@param params: Array, parametros de condicion																												*/
/**		@param sql: String, consulta																																				*/
/**		@param callback: Funcion, devuelve los resultados																									 	*/
/**																																																				*/
/******************************************************************************************************** */

const Query = (params, sql, callback) => {
  sql = sql.toString();

  const request = new Request(sql, (err, rowCount) => {
    if (err) {
      console.log(err);
      return;
		} else {
			console.log(rowCount+' registros encontrados');
		}
  });

  if (params.length > 0) {
    params.forEach(param => {
      request.addParameter(param.name, param.type, param.value);
    });
  }

  let _rows = [];

  request.on("row", columns => {
    var _item = {};
    // Converting the response row to a JSON formatted object: [property]: value
    for (var name in columns) {
      _item[name] = columns[name].value;
    }
    _rows.push(_item);
	});
	
	request.on('requestCompleted', function () {
		callback(_rows);
	});

	connection.execSql(request);
}





module.exports = {
  BuildParams,
	Query,
	Desconectar,
	Conectar
};
	