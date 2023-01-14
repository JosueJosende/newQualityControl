'use strict'

/******************************************************************************************************** */
/**																																																				*/
/**		Requerimientos de modulos de terceros y locales.																									 	*/
/**																																																				*/
/**		SERVER:					Archivo de configuracion de la aplicacion																						*/
/**		querystring: 		Modulo gestion archivos JSON																												*/
/**		{ curly }: 			Modulo gestion archivos JSON																												*/
/**		{ setTimeout }: Modulo gestion archivos JSON																												*/
/**																																																				*/
/******************************************************************************************************** */

const { SERVER } = require('../config/globals');
const querystring = require('querystring');			
const { curly } = require('node-libcurl');
const { setTimeout } = require('timers/promises');
const { Server } = require('http');


/**********************************************************************************************************/
/**																																																				*/
/** 	Constantes:																													 																*/
/** 		getUrl: URl para pedir datos en la API de carel										 																*/
/** 		setUrl: URl para escribir datos en la API de carel								 																*/
/**																																																				*/
/**********************************************************************************************************/

const getUrl = SERVER.urlApiCarel + 'getvar.csv?';
const setUrl = SERVER.urlApiCarel + 'setvar.csv';
const alarms = SERVER.urlApiCarel + 'commissioning/alarms.cgi?';




/**********************************************************************************************************/
/**																																																				*/
/**	 	Envia peticion a la API(carel), si la peticion fue satisfactoria retorna true, o false si esta			*/
/** 	falla.																																															*/
/**																																																				*/
/** 	@param objeto - { object } contiene los valores a establecer en la API(Carel)												*/
/** 	@param aborto - boolean, se ejecuta, si se ha invocado la finalizacion manual de la verificacion		*/
/** 	@returns -  retorna una promosa.  True o False																											*/
/**																																																				*/
/**********************************************************************************************************/
 
const setApiCarel = async (objeto, aborto) => {
	try {
		let sendData = await curly.post(setUrl, {
			postFields: querystring.stringify(objeto)
		});

		aborto ? await setTimeout(1000) : '';

		if (sendData.statusCode === 200) {
			//console.log(sendData.data);
			return true;
		}
	} catch (error) {
		console.log(error);
		return false;
	}
}





/**********************************************************************************************************/
/**																																																				*/
/** 	Un objeto y un booleano como parámetros, realiza solicitud a la API y devuelve los datos recibidos.	*/
/**																																																				*/
/** 	@param objeto 																																											*/
/** 	@return 																																														*/
/**   	"status": "OK",																																										*/
/**   	"data": {	objeto }																																								*/
/**																																																				*/
/**********************************************************************************************************/

const getApiCarel = async (objeto) => {
	try {
		let requestData = await curly(getUrl, {
			postFields: querystring.stringify(objeto)
		})

		if (requestData.statusCode === 200) {
			//console.log(requestData.data);
			return parseoDatos(requestData.data);
		}
	} catch (error) {
		console.log(error);
		return false;
	}
}





/**********************************************************************************************************/
/**																																																				*/
/** 	Hace una peticion POST a un script CGI de la API(Carel). Parsea los datos obtenidos y retorna 			*/
/**		un array de objetos con el codigo y descripcion de la/s alarma/s																		*/
/**																																																				*/
/** 	@returns - array de objetos																																					*/
/**																																																				*/
/**********************************************************************************************************/

const getAlarmas = async () => {
	let alarmas = [];

	try {
		let getAlarmas = await curly(alarms, {
			postFields: querystring.stringify({ 'action': ['getActive'] })
		})

		if (getAlarmas.statusCode === 200) {
			let esplit = getAlarmas.data.split(/[(\r\n\s)\r\n\s]+/);

			for (let i = 1; i < esplit.length - 1; i++) {
				let parametros = esplit[i].split(',');
				
				alarmas.push({
					"code": parametros[0],
					"descripcion": parametros[1]
				})
			}
			return alarmas
		}
	} catch (error) {
		return 'No es posible obterner las alrmas del verificador automatico.'
	}
}





/**********************************************************************************************************/
/**																																																				*/
/** 	Parsea los datos que se le pasa por parametro para que sean legibles y tratables en otros modulos		*/
/**																																																				*/
/** 	@returns - objeto																																										*/
/**																																																				*/
/**********************************************************************************************************/

const parseoDatos = async (datos) => {
	let allRows = datos.split(/\r?\n|\r/);
	let singleRow;
	let objectData = {};

	for (singleRow = 1; singleRow < allRows.length - 1; singleRow++) {
		let props = allRows[singleRow].split(',');    
		let name = props[0].slice(1).replace('.', '_').replace('.', '_').slice(0, props[0].length - 2);
		let val = props[5].slice(1).slice(0, props[5].length - 2);

		name.toString();
		
		props[3] === 'BOOL' ? val === '0' ? val = false : val = true : '';
		props[3] === 'INT' || props[3] === 'UINT' || props[3] === 'UDINT' || props[3] === 'DINT' || props[3] === 'USINT' ? val = parseInt(val) : '';
		props[3] === 'REAL' ? val = parseFloat(val) : '';

		let prop;

		for (prop = 0; prop < props.length; prop++) {
			objectData[name] = val !== true && val !== false ? val : val === true ? val = 1 : val = 0;
		}
		
	}
	return objectData;
}





module.exports = {
	setApiCarel: setApiCarel,
	getApiCarel: getApiCarel,
	getAlarmas: getAlarmas
};