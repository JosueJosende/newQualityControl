'use strict'

/******************************************************************************************************** */
/**																																																				*/
/**		Requerimientos de modulos de terceros y locales.																									 	*/
/**																																																				*/
/**		GLBL: 			Archivo de configuracion de la aplicacion																								*/
/**		JsonDB: 		Modulo gestion archivos JSON																														*/
/**		Config: 		Modulo gestion archivos JSON																														*/
/**																																																				*/
/******************************************************************************************************** */

const GLBL = require('../config/index');
const { JsonDB } = require('node-json-db');
const { ConfigDB } = require('node-json-db/dist/lib/JsonDBConfig');



/**********************************************************************************************************/
/**																																																				*/
/** 	El segundo argumento se usa para decirle a la base de datos que guarde automaticamente							*/
/**			Si es false, se deberá llamar al metodo save() despues de cada accion 														*/
/**																																																			 	*/
/**		El tercer argumento guarda los datos en formato lectura facil. (default false)											*/
/**			Si es true, formato lectura facil																																	*/
/**			Si es false, formato minimizado																																		*/
/**																																																				*/		
/**		El último argumento es el separador, por defecto  slash (/)																					*/	
/**																																																				*/
/**********************************************************************************************************/

/******************************************************************************************************** */
/**																																																				*/
/**		BBDD donde se guardaran los datos de la verificacion en curso.																		 	*/
/**																																																				*/
/******************************************************************************************************** */

module.exports.datosVerificacion = new JsonDB(new ConfigDB('../models/' + GLBL.SERVER.nombre, true, false, '/'));




/******************************************************************************************************** */
/**																																																				*/
/**		BBDD con la relacion de componentes de un equipo por numero de articulo.													 	*/
/**																																																				*/
/******************************************************************************************************** */

module.exports.componentes = new JsonDB(new ConfigDB('../models/componentes', true, false, '/'));




/******************************************************************************************************** */
/**																																																				*/
/**		BBDD donde se guardaran las verificaciones de equipos empezadas pero no finalizadas.							 	*/
/** 	con la posibilidad de retomar en el punto donde se quedo.																						*/
/**																																																				*/
/******************************************************************************************************** */

module.exports.inacabadas = new JsonDB(new Config('../verificaciones/inacabadas', true, false, '/'));




/******************************************************************************************************** */
/**																																																				*/
/**		Se crea un archivo por cada verificacion acabada con exito.																				 	*/
/**																																																				*/
/******************************************************************************************************** */

module.exports.createJson = async (datos) => {
	let dbFin = new JsonDB(new Config('./verificaciones/finalizadas/' + datos.nombre + '_' + datos.numSerie, true, false, '/'));
	
	try {
		dbFin.push('/', datos);
	} catch (err) {
		console.log('Ocurrio un error al guardar la verificacion en finalizadas: ', err);
	}
}

