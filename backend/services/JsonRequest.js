'use strict'

/**********************************************************************************************************/
/**																																																				*/
/**		Requerimientos de modulos de terceros y locales.																									 	*/
/**																																																				*/
/**		datosVerificacion: 	bbdd de verificacion en curso																										*/
/**		inacabadas: 				bbdd de verificaciones inacabadas																								*/
/**		createJson: 				bbdd donde crea un nuevo archivo Json con la verificacion finalizada						*/
/**																																																				*/
/******************************************************************************************************** */

const { datosVerificacion, inacabadas, createJson } = require('../models/index');





/**********************************************************************************************************/
/**																																																				*/
/**		Añade los datos a la base de datos.																																	*/
/**																																																				*/
/** 	@param ruta - La ruta donde ha de guardar los datos.																								*/
/** 	@param data - Los datos a guardar.																																	*/
/** 	@param machacar - si es true, sobreescribe los datos, si es false, adiciona los datos								*/
/**																																																				*/
/**********************************************************************************************************/

const pushData = async (ruta, data, machacar) => {
	if (ruta === '') ruta = '/';

	try {
		datosVerificacion.push(ruta, data, machacar);
	} catch (error) {
		console.log('JsonRequest.js [pushData]', error);
	}
}





/**********************************************************************************************************/
/**																																																				*/
/**		Obtiene datos a la base de datos.																																		*/
/**																																																				*/
/** 	@param ruta - La ruta donde ha de obtener los datos.																								*/
/**																																																				*/
/**********************************************************************************************************/

const getData = async (ruta) => { 
	try {
		if (ruta) return datosVerificacion.getData(ruta);
	} catch (error) {
		console.log('JsonRequest.js [getData]', error);
	}
}





/**********************************************************************************************************/
/**																																																				*/
/**		Elimina datos a la base de datos.																																		*/
/**																																																				*/
/** 	@param ruta - La ruta donde ha de eliminar los datos.																								*/
/**																																																				*/
/**********************************************************************************************************/

const delData = async (ruta) => {
	try {
		datosVerificacion.delete(ruta);
	} catch (error) {
		console.log('JsonRequest.js [delData]', error);
	}
}





/**********************************************************************************************************/
/**																																																				*/
/**		Guarda los datos de verificacion finalizada en un archivo numSerie+modelo.Json, o en el							*/
/**		archivo  inacabadas.json si la verificacion finalizó antes de acabar.																*/
/**																																																				*/
/** 	@param datos - objeto contiene todos los datos adquiridos en la verificación.												*/
/** 	@param donde - string delimita donde se guardarán los datos.																				*/
/**																																																				*/
/**********************************************************************************************************/

const saveVerificacion = async (datos, donde) => {
	if (!datos) datos = datosVerificacion.getData('/');

	if (donde === 'inacabadas') {
		try {
			inacabadas.push('/'+datos.numSerie, datos);
		} catch (err) {
			console.log('Ocurrio un error al guardar la verificacion en inacabadas: ', err);
			return false;
		}
	}

	if (donde === 'finalizadas') {
		createJson(datos);
	}
}





module.exports = {
	pushData: pushData,
	getData: getData,
	delData: delData,
	saveVerificacion: saveVerificacion
};