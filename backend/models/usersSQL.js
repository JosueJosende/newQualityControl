'use strict'

// Requeriment de dependencies
const { APP, ESTADOS } = require('../config/index');
const { datosSinConexion } = require('../models/datosSinConexion.json');
const { BuildParams, Query } = require('../services/Axapta');
const TYPES = require("tedious").TYPES;

// Se utiliza para  cuando la exportacion dentro de un modulo  se crea una dependencia circular. 
delete require.cache[require.resolve('../services/Axapta.js')];





/******************************************************************************************************/
/**																																																		*/
/** 	Consulta a la BBDD (Axapta)																																			*/
/**																																																		*/
/**			Retorna el listado de verificadores con sus respectivas contraseñas,													*/
/**			pero nunca enviamos las contraseñas al frontend, solo nombres de usuarios											*/
/**																																																		*/
/******************************************************************************************************/

const ListadoVerificadores = (callbak) => {

	// Comprobamos si está establecida la conexión con Axapta.
	if (ESTADOS.EstadoAxapta) {

		// Construcción de la consulta.
		let parametrosVerificadores = [];
		let sql = 'SELECT NAME, ALIAS FROM EMPLTABLE WHERE HITEMPLESPECIALIDADID = @especialidad';

		BuildParams(parametrosVerificadores, 'especialidad', TYPES.VarChar, 'Verif');

		Query(parametrosVerificadores, sql, resultado => {


			// Almacenamos en un nuevo array, los nombres (formateados) y contraseñas
			let copiaResultado = [];

			for (let i = 0; i < resultado.length; i++) {
				copiaResultado.push({
					name: nombreFormateado(resultado[i]["0"]),
					pass: resultado[i]["1"]
				});
			}


			// Alamacenamos en bbdd "datosSinConexion" los datos de la "copiaResultado" 
			datosSinConexion.push("/verificadors", copiaResultado);


			// Retornamos datos del listado de verificadores obtenidos y tratado de la consulta SQL
			callbak(copiaResultado.find(el => { delete el.pass }));

		})

	} else {

		// Retornamos los nombres de usuario
		callbak(datosSinConexion.getData('/verificadors').find(el => { delete el.pass }));
	}
}




/******************************************************************************************************/
/**																																																		*/
/** 	Función [ Formatea el nombre que se le pasa, ordenandolo por nombre y apellidos e 							*/
/**							insertando la primera letra en mayúsculas	]																						*/
/**																																																		*/
/**			@param: name (ej. real jose luis)																															*/
/**			@return: Jose Luis Real																																				*/
/**																																																		*/
/******************************************************************************************************/

const nombreFormateado = (name) => {
	let verificador;

	// Pasa a mayusculas el nombre y apellidos y los separa conviento cada uno de ellos en un elemento del array "nombreApellidos []"
	let nombreApellidos = name.toLowerCase().replace(/\b\w/g, function (l) { return l.toUpperCase() }).split(' ');


	// Ordemamos en la variable verificador, primero el nombre y despues los apellidos
	if (nombreApellidos.length === 2) verificador = nombreApellidos[1] + ' ' + nombreApellidos[0];
	if (nombreApellidos.length === 3) verificador = nombreApellidos[2] + ' ' + nombreApellidos[0];
	if (nombreApellidos.length === 4) verificador = nombreApellidos[2] + ' ' + nombreApellidos[3] + ' ' + nombreApellidos[0];

	
	// Retornamos el resultado
	return verificador;
}





/******************************************************************************************************/
/**																																																		*/
/** 	Función [ Formatea el nombre que se le pasa, ordenandolo por nombre y apellidos e 							*/
/**							insertando la primera letra en mayúsculas	]																						*/
/**																																																		*/
/**			@param: name (ej. real jose luis)																															*/
/**			@return: Jose Luis Real																																				*/
/**																																																		*/
/******************************************************************************************************/

const Autenticacion = (dades, socket) => {

	// Almacena el verificador seleccionado si lo ecuentra en la bd local(JSON)
	let verificador;
	// Recupera y almacena todos los verificadores.
	let verificadores = db.getData('/verificadors');
		

	// Busca el verificador seleccionado
	verificador = verificadores.find((obj, id) => {
		if(obj.name === dades.user)  return true;
	});
		


	if (verificador) {

		// Comprueba que la contraseña pasada por el usuario es la correcta
		if (verificador.pass === dades.pass) {
		
			// Guarde el nombre del verificador identificado, en variable GLOBAL
			APP.operario = dades.user;
			
			// Declaracion variables, se almacenan la cantidad de verificaciones que ha llevadoa a cabo el verificador autenticado
			let anyActual = new Date().getYear(); // devuelve los dos ultimos nuemros del año 20(22)
			let regTotales = 0;
			let regAnyoAnterior = 0;
			let regAnyoActual = 0;

			// Si hay comunicación con AXAPTA ...
			if (ESTADOS.EstadoAxapta) {

				// Consulta a tabla verificaciones, filtrado por el nombre de operario 
				let params = [];
				let sql = 'SELECT MAQUINA, FECHA_VERIFICACION FROM HITDATOSVERIFICACION WHERE VERIFICADOR = @operario';

				Axapta.buildParams(params, 'operario', TYPES.VarChar, dades.user);
				Axapta.query(params, sql, result => {
					// Tratamos el resultado para coger los siguientes datos: nº de equipos verificados por el verificador autenticado.
					// 																												nº de equipos verificados por el verificador autenticado del año anterior
					// 																												nº de equipos verificados por el verificador autenticado del año en curso
					regTotales = result.length;

					for (let i = 0; i < result.length; i++) {
						let arrayFecha = result[i]["1"].split('/');

						if (parseInt(arrayFecha[2]) === (anyActual - 100)) regAnyoActual++
						if (parseInt(arrayFecha[2]) === (anyActual - 101)) regAnyoAnterior++;
					}
						
					// Enviamos al frontend los datos 
					socket.emit('auth', { verificador: verificador.name, numTotales: regTotales, numAnteriores: regAnyoAnterior, numActuales: regAnyoActual });
				});

				// Sin comunicacion con AXAPTA. Enviamos al frontend las variables con valor 0	
			} else {
				socket.emit('auth', { verificador: verificador.name, numTotales: 0, numAnteriores: 0, numActuales: 0 });
			}

		// El password recibido no es correcto, informamos al frontend devolviendo un -1	
		} else {
			socket.emit('auth', -1);
		}

	// Nombre de usuario no encontrado en la bbdd de Axapta, informamos al frontend con un -1
	} else {
		log.error('Intento de autenticacion con un verificador que no esxiste: ' + dades.user);
		socket.emit('auth', -1);
	}
}


module.exports = {
  ListadoVerificadores,
	Autenticacion
};