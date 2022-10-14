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

module.exports.datosVerificacion = new JsonDB(new ConfigDB('../models/'+GLBL.SERVER.nombre, true, false, '/'));

module.exports.componentes = new JsonDB(new ConfigDB('../models/componentes', true, false, '/'));

