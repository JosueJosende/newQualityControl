'use strict'

/******************************************************************************************************** */
/**																																																				*/
/**		Requerimientos de modulos de terceros y locales.																									 	*/
/**																																																				*/
/******************************************************************************************************** */
const { APP, COMPONENTE, ESTADOS, VERIFICACION } = require('../config/index');
const { inacabadas, datosSinConexion, componentes } = require('../models/index');
const { toClient } = require('../services/SendToClient');
const { delData, pushData } = require('../services/JsonRequest');
const { initVerififcacion } = require('../controllers/verificacionController');
const { setApiCarel } = require('../services/CurlRequest');













/******************************************************************************************************** */
/**																																																				*/
/**		@function: Publica																																									*/
/**		@description: Parsea datos de la estructura datosVerificacion y los establece en la estructura		 	*/
/**									"dadesVerificacio" de csuite.																													*/
/**																																																				*/
/** 	@param: datos --> Objeto 																																						*/
/**	 																																																			*/
/******************************************************************************************************** */

const setEquipo = (datosVerificacionCliente) => {

	APP.debug ? console.log('Preparación de archivo que contendrá todos los datos para la verificación,') : '';
	APP.debug ? console.log('y establecimiento de datosores en estructura del controlador (uPC3).') : '';

	// Por seguridad, establecemos las variables globales de verificación en FALSE

	VERIFICACION.TiemposGuardados = false;
	VERIFICACION.TiemposModificados = false;
	VERIFICACION.SetDatosVerificacion = false;
	VERIFICACION.SetTrazabilidad = false;
	VERIFICACION.SoftInstalado = false;
	VERIFICACION.FinVerificacion = false;





	// Antes de escribir los datos de la estructura en el archivo, eliminamos cualquier dato que haya podido
	// quedar, por error de programación o cualquier otra causa.
	// Una vez limpio el archivo .json, escribimos con los datos que recibimos por parte del cliente.

	delData('/').then(() => {
		APP.debug ? console.log('    - Borrado de datos residuales.') : '';

		pushData('/', datosVerificacionCliente, true).then(() => {
			APP.debug ? console.log('    - Datos de verificación, escritos correctamente en el archivo .json') : '';

			// Llamada a funcion "setDataInController", se encarga de introducir datos en uPC-3 (Carel).
			setDataInController(datosVerificacionCliente).then((resultado) => {
					APP.debug ? console.log('    - Establecidos los datos en (uPC3) controlador.') : '';

					setTimeout(() => {
						initVerififcacion();
					}, 1500);

					VERIFICACION.RunLoop = true;
					VERIFICACION.SoftInstalado = true;

					toClient('resultadoDatosEquipo', true);

			}).catch((err) => {

				APP.debug ? console.log('    - No se pudo establecer los datos en (uPC3) controlador.') : '';
				toClient('resultadoDatosEquipo', false);
			});

		}).catch((err) => {
			
			APP.debug ? console.log('    - Hubo un problema y no se pudo escribir en el archivo "verificacion.json".') : '';
			APP.debug ? console.log('      Error: ') : '';
			APP.debug ? console.warn('      ' + err) : '';
		});

	}).catch((err) => {

		APP.debug ? console.log('    - Hubo un problema y no se pudo limpiar el archivo "verificacion.json".') : '';
		APP.debug ? console.log('      Error: ') : '';
		APP.debug ? console.warn('      ' + err) : '';
	});
}













/******************************************************************************************************** */
/**																																																				*/
/**		@function: Privada																																									*/
/**		@description: Establece los datos recibidos del cliente con la estructura para la verificación		 	*/
/**									en "dadesVerificacio" de csuite.																											*/
/**																																																				*/
/** 	@param: callback --> Retorna el resultado de la funcion, true or false															*/
/**	 																																																			*/
/******************************************************************************************************** */

const setDataInController = async (datos) => {

	// Variables de ayuda a la construcción de datos
	let maxCurrentVI = 0;
	let minCurrentVI = 0;
	let maxCurrentVE = 0;
	let minCurrentVE = 0;
	let maxCurrentBomba = 0;
	let caudalBomba = 0;
	let maxCurrentComp1 = 0;
	let maxCurrentComp2 = 0;
	let minCurrentComp1 = 0;
	let minCurrentComp2 = 0;
	let potenciaVI = 0;
	let potenciaVE = 0;
	let potenciaBomba = 0;
	let potenciaComp1 = 0;
	let potenciaComp2 = 0
	let tipoVentext = 0;
	let tipoVentInt = 0;
	let vi = '';


	// Condicionamos los datos para extraer los datosores de un objeto y colocarlos en variables.

	datos.radial.length > 0 ? ( vi = 'radial', tipoVentInt = 1 ) : '';
	datos.motor.length > 0 ? ( vi = 'motor', tipoVentInt = 2) : '';
	datos.turbina.length > 0 ? (vi = 'turbina', tipoVentInt = 3) : '';
	
	maxCurrentVI = datos[vi][0].maxAmperios;
	minCurrentVI = datos[vi][0].minAmperios;
	potenciaVI = datos[vi][0].PotAbsorbida;
		

	if (datos.axial.length > 0) {
		tipoVentext = 1;
		maxCurrentVE = datos.axial[0].maxAmperios;
		minCurrentVE = datos.axial[0].minAmperios;
		potenciaVE = datos.axial[0].PotAbsorbida;
	}

	if (datos.bomba.length > 0) {
		tipoVentext = 1;
		maxCurrentBomba = datos.bomba[0].maxAmperios;
		caudalBomba = datos.bomba[0].caudal;
		potenciaBomba = datos.bomba[0].PotAbsorbida;
	}

	if (datos.compresor.length > 0) {
		maxCurrentComp1 = datos.compresor[0].maxAmperios;
		minCurrentComp1 = datos.compresor[0].minAmperios;
		potenciaComp1 = datos.compresor[0].PotAbsorbida;
	}

	if (datos.compresor.length > 1) {
		maxCurrentComp2 = datos.compresor[1].maxAmperios;
		minCurrentComp2 = datos.compresor[1].minAmperios;
		potenciaComp2 = datos.compresor[1].PotAbsorbida;
	}

	let maxPotenciaResAntiHielo = datos.resistHielo.watios * datos.resistHielo.numResistencias;
	let resistenciaAntihielo;
	datos.resistHielo.numResistencias > 0 ? resistenciaAntihielo = 1 : resistenciaAntihielo = 0; 





	

	let setVars1 = {
		'DadesVerificacio.cabal_aiguaFred': datos.caudal_agua_frio,
		'DadesVerificacio.cabal_aiguaCalor': datos.caudal_agua_calor,
		'DadesVerificacio.cabalAireEvaporador': datos.caudal_aire_evap,
		'DadesVerificacio.cabalAireCondensador': datos.caudal_aire_cond,
		// 'DadesVerificacio.caudalimetre': datos.
		// 'DadesVerificacio.control_hidraulic': datos.
		'DadesVerificacio.diposit_inercia': datos.kitHidronico,
		'DadesVerificacio.equip': datos.numEquip,
		'DadesVerificacio.hab_tht_tune': datos.terminalTHTUNE,
		'DadesVerificacio.he': datos.he,
		'DadesVerificacio.inverter': datos.inverter,
		'DadesVerificacio.max_consum_res_antigel': maxPotenciaResAntiHielo,
	};

	let setVars2 = {
		'DadesVerificacio.max_consum_res_carter': datos.resistCarter.comp1 + datos.resistCarter.comp2 + datos.resistCarter.comp3 + datos.resistCarter.comp4,
		'DadesVerificacio.max_corrent_ve': maxCurrentVE,
		'DadesVerificacio.IntensidadBomba': maxCurrentBomba,
		'DadesVerificacio.max_current_comp1': maxCurrentComp1,
		'DadesVerificacio.max_current_comp2': maxCurrentComp2,
		'DadesVerificacio.min_corrent_vi': maxCurrentVI,
		'DadesVerificacio.mesurador_energia': datos.medidorEnergia,
		'DadesVerificacio.mesurador_mono': datos.medidorMono,
		'DadesVerificacio.mesurador_trif': datos.medidorTri,
		'DadesVerificacio.min_corrent_comp1': minCurrentComp1,
		'DadesVerificacio.min_corrent_comp2': minCurrentComp2,
	};

	let setVars3 = {
		'DadesVerificacio.min_corrent_ve': minCurrentVE,
		'DadesVerificacio.min_corrent_vi': minCurrentVI,
		'DadesVerificacio.cabalGeneralBomba': caudalBomba,
		'DadesVerificacio.model': datos.model,
		'DadesVerificacio.nomes_fred': datos.soloFrio,
		'DadesVerificacio.num_bombas': datos.numbombas,
		'DadesVerificacio.num_circuits': datos.circuitos,
		'DadesVerificacio.num_compressors': datos.compresores,
		'DadesVerificacio.num_resistencies_elec': datos.numResistenciasElec,
		'DadesVerificacio.num_serie': datos.numSerie,
		'DadesVerificacio.num_ventiladors_interiors': datos.ventiladores_int,
	};

	let setVars4 = {
		'DadesVerificacio.num_ventiladors_exteriors': datos.ventiladores_ext,
		'DadesVerificacio.pdp': datos.pdp,
		'DadesVerificacio.pkdm': datos.PKDT,
		'DadesVerificacio.PotenciaBomba': potenciaBomba,
		'DadesVerificacio.potencia_ve': potenciaVE,
		'DadesVerificacio.potencia_vi': potenciaVI,
		'DadesVerificacio.potencia_max_comp1': potenciaComp1,
		'DadesVerificacio.potencia_max_comp2': potenciaComp2,
		'DadesVerificacio.potenciaFrigBomba': datos.potencia_frig_calor,
		'DadesVerificacio.potenciaFrigFred': datos.potencia_frig_frio,
		'DadesVerificacio.pressio_aigua': datos.presionAgua,
	};

	let setVars5 = {
		'DadesVerificacio.recuperador_calor': datos.recuperadorCalor,
		'DadesVerificacio.refrigerant': datos.refrigerante,
		'DadesVerificacio.resistencia_plaques': resistenciaAntihielo,
		'DadesVerificacio.rotacio_bombes': datos.rotacionBombas,
		'DadesVerificacio.termico_bomba': datos.termicoBomba,
		'DadesVerificacio.sondaExterior': datos.sondaExterior,
		'DadesVerificacio.sondaImpulsio': datos.sondaimpulsionNTC,
		'DadesVerificacio.sondaRetorn': datos.sondaRetorno,
		'DadesVerificacio.termico_ventExt': datos.termicoVentiladorExt,
		'DadesVerificacio.termico_ventInt': datos.habTermicoVentInt,
		'DadesVerificacio.termico_compressor': datos.termicoCompresor,
		
	};

	let setVars6 = {
		'DadesVerificacio.termico_resistencia': datos.termicoResistencia,
		'DadesVerificacio.tipo_vent_ext': tipoVentext,
		'DadesVerificacio.tipo_vent_int': tipoVentInt,
		'DadesVerificacio.datosvula_pressotatica': datos.controlCondensacion,
		'DadesVerificacio.datosvula_tall': datos.datosvulaCorte,
		'EstatComunicacioServer': 1,
	};


	try {
		setApiCarel(setVars1).then(() => {
			setApiCarel(setVars2).then(() => {
				setApiCarel(setVars3).then(() => {
					setApiCarel(setVars4).then(() => {
						setApiCarel(setVars5).then(() => {
							setApiCarel(setVars6).then((resultEnd) => {
								if (resultEnd) {

									VERIFICACION.SetDatosVerificacion = true;
									return true;
								}
							});
						});
					});
				});
			});
		});

	} catch (error) {
		return false;
	}

}












let numSerieEquipo; 										// Almacena el numero de serie ya formateado.
let datosVerificacion;									// Almacena los datos de una verificación recuperada o construida
																				// a partir de las consultas a la bbdd Axapta




/******************************************************************************************************** */
/**																																																				*/
/**		@function: Publica																																									*/
/**		@description: Obtiene todos los datos necesarios para del equipo a verificar, pasando como				 	*/
/**									parámetro el numero de serie del equipo en cuestión																		*/
/**																																																				*/
/** 	@param: datosEquipo --> Objeto ó String [ Objeto si no hay conexión con bbdd ]											*/
/**	 																																																			*/
/******************************************************************************************************** */

const getEquipo = (datosEquipo) => {

	// Si el tipo de datos recibidos es un objeto --> comprobamos que la propiedad "numSerie" contiene
	// 9 caracteres, de no ser así enviamos respuesta al socket indicando que el número de serie es erroneo.

	if (typeof datosEquipo === 'object') {
		datosEquipo.numSerie.length === 9 ? numSerieEquipo = datosEquipo.numSerie : response({ err: 1, txtErr: 'Longitud del numero de serie incorrecta' }); 
	}



	/** *****************************************************************************************************/ 
	/**																																																			*/
	/**		Si el tipo de datos recibidos es un String --> formateamos el datosor recibido "datosEquipo" y lo		*/
	/**		almacenamos en la variable numSerieEquipo, una vez formateado, de ser diferente de 9 el número de */
	/**		caracteres, enviamos respuesta a socket indicando que el numero de serie inntroducido no es 			*/
	/**		correcto.																																													*/
	/**																																																			*/
	/** *****************************************************************************************************/
	
	if (typeof datosEquipo === 'string') {
		datosEquipo.length > 9 ? numSerieEquipo = formatNumSerie(datosEquipo) : datosEquipo.length === 9 ? numSerieEquipo = datosEquipo : response({ err: 1, txtErr:'Longitud del numero de serie incorrecta' });
	}



	if (numSerieEquipo.length === 9) {
		
		/** ************************************************************************************************	*/
		/*																																																		*/
		/*  Hacemos (try) para buscar si el equipo esta en la lista de verificaciones empezadas 							*/
		/*  pero no finalizadas. 																																							*/
		/* 																																																		*/
		/* 	si equipo, preguntaremos al cliente si quiere reanudar o empezar de nuevo.												*/
		/*		si la opcion es reanudar, enviamos datos al cliente y cargamos los necesarios en el servidor.		*/
		/*	 	si la opcion es nuevo, borramos los datos guardados anteriormente y empezamos como nuevo.				*/
		/*																																																		*/
		/** ************************************************************************************************* */

		try {
			datosVerificacion = inacabadas.getData('/' + nSerieFormateado);
			APP.debug ? console.log('getEquipo(): Encontrada verificación inacabada, datos enviados al cliente. Esperando respuesta...') : '';
			response(datosVerificacion);

		}
		




		/** ************************************************************************************************	*/
		/*																																																		*/
		/*  (catch) Para iniciar una verificación de equipo nueva.															 							*/
		/*  																																																	*/
		/* 	Si hay conexión con Axapta, obtenemos los datos de verificación realizando consultas							*/
		/* 	la función privada getDataSQL() se encargara de la lógica																					*/
		/* 																																																		*/
		/* 	Si no hay conexión con Axapta, obtenemos los datos de verificación desde archivo JSON							*/
		/* 	la función privada getDataJSON() se encarga de la lógica																					*/
		/*																																																		*/
		/** ************************************************************************************************* */
		
		catch (e) {
			ESTADOS.EstadoAxapta ? getDataSQL() : getDataJSON(datosEquipo);
		}
	}

}


















/******************************************************************************************************** */
/**																																																				*/
/**		@function: Privada																																									*/
/**		@description: Crea la estructura de datos a partir de los archivos JSON con los datos minimos			 	*/
/**									para realizar la verificación del equipo. Esta función solo se ejecuta si no					*/
/**									hay conexión con Axapta.																															*/
/**																																																				*/
/** 	@param: datosEquipo --> Objeto construido en el cliente																							*/
/**														{ maquina: xxx, numModel: xxx, nomEquip: xxx }															*/
/**	 																																																			*/
/******************************************************************************************************** */

const getDataJSON = (datosVue) => {

	let estructura;


	switch (datosVue.maquina) {
		case 1:
			estructura = datosSinConexion.getData('/wph');
			break;
		
		case 3:
			estructura = datosSinConexion.getData('/kr3');
			break;
		
		case 4:
			estructura = datosSinConexion.getData('/ukr3');
			
		case 5, 6:
			estructura = datosSinConexion.getData('/mbxc');
			break;
	
		default:
			APP.debug ? console.log('No se ha podido crear la estructura de datos, el numero de maquina enviado por el cliente no es datosido.') : '';
			estructura = {}
			break;
	}

	toClient('resEquip', {
		...{
			"numSerie": numSerieEquipo,
			"num_orden": '',
			"articulo": '',
			"nombreCompleto": datosVue.nomEquip+' - '+datosVue.numModel,
			"nombre": datosVue.nomEquip,
			"model": datosVue.numModel,
			"voltage": '',
			"configuracion": ''
		},
		...estructura
	});

	APP.debug ? console.log('Estructura de datos creada a partir de datos sin conexión.') : '';

}





















/******************************************************************************************************** */
/**																																																				*/
/**		@function: Privada																																									*/
/**		@description: Crea la estructura de datos a partir de consultas realizadas a Axpata (bbdd).				 	*/
/**									Esta función solo se ejecuta si hay conexión con Axapta.															*/
/**																																																				*/
/**	 																																																			*/
/******************************************************************************************************** */

const getDataSQL = () => {

	let params = [];
	
	// Consulta para recuperar datos del equipo, se realiza la busqueda por el numero de serie 
	let sql = 'SELECT HITPRODNUMORDEN, ITEMID, ITEMNAME, CONFIGID FROM HITPRODLISTADOSTABLE WHERE INVENTSERIALID = @nserie';

	Axapta.buildParams(params, 'nserie', TYPES.VarChar, numSerieEquipo);		
	Axapta.query(params, sql, result => { 

		if (result.length === 0) {

			// Gestión cuando no encuentra ningún equipo con el número de serie pasado
			toClient('resEquip', { err: 2, txtErr: 'No existe equipo con ese numero de serie' });

		} else {

			// Consulta retorna datos del equipo, creamos estructura de verificación

			/************************************************************************************************** */
			/**																																																	*/
			/**				Respuesta de la consulta: de los datos recibidos, obtenemos:															*/
			/**					Nombre del equipo: ej. Kr3B 																														*/
			/**				 	Modelo del equipo: ej. 160																															*/
			/**					Numero de equipo: [1, 2, 3, 4, 5, 6]																										*/
			/**					Número de articulo																																			*/
			/**					Voltaje: [230v. / 400v]																																	*/
			/**					Inverter.																																								*/
			/**																																																	*/
			/**				Deduce que tipo de equipo se va a verificar																								*/
			/**	 																																																*/
			/****************************************************************************************************/
			
			let nombre;
			let modelo;
			let voltaje;
			let he;
			let equipo;
			let inverter = 0;
			let model;
			let path;
			let subsStr_1 = result[0]["2"].split(' ');
			let subsStr_2 = result[0]["2"].split('-');
						
			result[0]['2'].indexOf('HE') !== -1 ? he = 1 : he = 0;

			result[0]['2'].indexOf('WPV') !== -1 ? (equipo = 2, path = '/wpv') : '';
			result[0]['2'].indexOf('Kr3') !== -1 ? (equipo = 3, path = '/kr3') : '';
			result[0]['2'].indexOf('uKr') !== -1 ? (equipo = 4, inverter = 1, path = '/ukr3') : '';
			result[0]['2'].indexOf('MB2C') !== -1 ? (equipo = 5, inverter = 1, path = '/mbxc') : '';
			result[0]['2'].indexOf('MB4C') !== -1 ? (equipo = 6, inverter = 1, path = '/mbxc') : '';
			
			if (result[0]['2'].indexOf('WPH') !== -1) {
				equipo = 1;
				path = '/wph';

				let st = subsStr_2[1].split(' ');

				nombre = subsStr_2[0];
				modelo = st[0];
				voltaje = subsStr_1[1]+subsStr_1[2];
			} else {
				nombre = subsStr_1[0];
				modelo = subsStr_1[1];
				voltaje = subsStr_1[2];
			}



			/************************************************************************************************** */
			/**																																																	*/
			/**				Crea extructura de datos obtenidos junto extructura por defecto, para											*/
			/**				su modificación de parametros.																														*/
			/**	 																																																*/
			/****************************************************************************************************/

			datosVerificacion = {
				...{
					numEquip: equipo,
					nombreCompleto: result[0]["2"],
					numSerie: numSerieEquipo,
					nombre: nombre,
					model: model,
					voltage: voltaje,
					num_orden: result[0]["0"],
					articulo: result[0]["1"],
					configuracion: result[0]["3"],
					he: he,
					inverter: inverter
				},
				...datosSinConexion.getData(path)
			}



			/************************************************************************************************** */
			/**																																																	*/
			/**				Según equipo y modelo, guardamos en el parámetro "model" de la extructura el datosor				*/
			/**				que tiene en el equipo, para su posterior configuración.																	*/
			/**	 																																																*/
			/****************************************************************************************************/

			if (equipo === 1 /*&& he === 1*/) {
				modelo === "091" ? datosVerificacion.model = 1 : '';
				modelo === "121" ? datosVerificacion.model = 2 : '';
				modelo === "141" ? datosVerificacion.model = 3 : '';
				modelo === "171" ? datosVerificacion.model = 4 : '';
				modelo === "201" ? datosVerificacion.model = 5 : '';
				modelo === "251" ? datosVerificacion.model = 6 : '';
				modelo === "351" ? datosVerificacion.model = 7 : '';
				modelo === "401" ? datosVerificacion.model = 8 : '';
				modelo === "501" ? datosVerificacion.model = 9 : '';
				modelo === "701" ? datosVerificacion.model = 10: '';
				modelo === "751" ? datosVerificacion.model = 11 : '';
				modelo === "1001" ? datosVerificacion.model = 12 : '';
				modelo === "1201" ? datosVerificacion.model = 13 : '';
			}

			if (equipo === 3) {
				modelo === "040" ? datosVerificacion.model = 15 : '';
				modelo === "045" ? datosVerificacion.model = 16 : '';
				modelo === "055" ? datosVerificacion.model = 17 : '';
				modelo === "065" ? datosVerificacion.model = 18 : '';
				modelo === "075" ? datosVerificacion.model = 19 : '';
				modelo === "085" ? datosVerificacion.model = 20 : '';
				modelo === "100" ? datosVerificacion.model = 21 : '';
				modelo === "120" ? datosVerificacion.model = 22 : '';
				modelo === "140" ? datosVerificacion.model = 23 : '';
				modelo === "160" ? datosVerificacion.model = 24 : '';
				modelo === "190" ? datosVerificacion.model = 25 : '';
				modelo === "235" ? datosVerificacion.model = 26 : '';
			}

			if (equipo === 4) {
				modelo === "17" ? datosVerificacion.model = 36 : '';
				modelo === "23" ? datosVerificacion.model = 37 : '';
				modelo === "30" ? datosVerificacion.model = 38 : '';
				modelo === "38" ? datosVerificacion.model = 39 : '';
			}

			if (equipo === 5) {
				modelo === "020" ? datosVerificacion.model = 41 : '';
				modelo === "026" ? datosVerificacion.model = 42 : '';
				modelo === "033" ? datosVerificacion.model = 43 : '';
				modelo === "040" ? datosVerificacion.model = 44 : '';
				modelo === "050" ? datosVerificacion.model = 45 : '';
			}

			if (equipo === 6) {
				modelo === "020" ? datosVerificacion.model = 46 : '';
				modelo === "030" ? datosVerificacion.model = 47 : '';
				modelo === "050" ? datosVerificacion.model = 48 : '';
			}



			/************************************************************************************************** */
			/**																																																	*/
			/**				LLama a la función que se encarga de extraeer y guardara los datos técnicos								*/
			/**				del equipo a verificar.																																		*/
			/**	 																																																*/
			/****************************************************************************************************/

			APP.debug ? console.log('Equipo: (' + datosVerificacion.nombreCompleto + ') guardado en extructura, se procede a consulta de datos técnicos.') : '';
			getTechnicalData();

		}
	});
}

















/******************************************************************************************************** */
/**																																																				*/
/**		@function: Privada																																									*/
/**		@description: Consulta a la tabla [INVENTTABLE] para extraer datos técnicos de la bbdd Axpata.		 	*/
/**									Esta función es llamada por su predecesora "getDataSQL()".														*/
/**																																																				*/
/**	 																																																			*/
/******************************************************************************************************** */

const getTechnicalData = () => {

	let params = [];
	let sql = 'SELECT HITAGUA, HITAGUAIN, HITNCOMPRE, HITWATIOS, HITWATIOSC, HITPOTENCR, HITPOTENFR, HITCAUDALIN, HITCAUDALEX, HITNUMVENTILADORES, HITPRESDISPINT, CIRCUITOS,  OBSERVACIONES, OBSERVACIONESTECNICAS, HITBASICOID, HITBOMBAID, HITVENTILADORESID, HITMASA FROM INVENTTABLE WHERE ITEMID = @articulo';

	Axapta.buildParams(params, 'articulo', TYPES.VarChar, datosVerificacion.articulo);
	Axapta.query(params, sql, result => {

		if (result.length === 0) {

			APP.debug ? console.log('La consulta de datos técnicos no devolvió ningún resultado.') : '';

		} else {

			// Consulta, retorna datos técnicos del equipo, modificación de parámetros de la estructura.

			/************************************************************************************************** */
			/**																																																	*/
			/**				Respuesta de la consulta: de los datos recibidos, obtenemos:															*/
			/**					Caudal de agua en frio.			 																														*/
			/**				 	Caudal de agua en calor.																																*/
			/**					Número de compresores.																																	*/
			/**					Consumo nóminal en frio																																	*/
			/**					Consumo nóminal en calor																																*/
			/**					Potencia nóminal en frio																																*/
			/**					Potencia nóminal en calor																																*/
			/**					Caudal de aire en condensadora																													*/
			/**					Caudal de aire en evaporadora																														*/
			/**					Número ventiladores exteriores																													*/
			/**					Tipo ventilacion exterior: 	C = centifugo, 																							*/
			/** 																		X = Axial, 																									*/
			/**																			N = Ambos(Axial y Centrifugo), 															*/
			/**																			S = Sin Ventilador 																					*/
			/**					// Número ventiladores interiores																												*/
			/**					Número de circuitos																																			*/
			/**					Observaciones en montaje																																*/
			/**					Observaciones técnicas																																	*/
			/**					Kilogramos de refigerante																																*/
			/**					Tipo de refrigerante																																		*/
			/**					Solo frio ó con bomba de calor																													*/
			/**																																																	*/
			/**				Deduce que tipo de equipo se va a verificar																								*/
			/**	 																																																*/
			/****************************************************************************************************/

		

			
			if (datosVerificacion.numEquip >= 3 && datosVerificacion.numEquip <= 6) {
				datosVerificacion.caudal_agua_frio = result[0]["1"];
				datosVerificacion.caudal_agua_calor = (result[0]["5"] * 3.6) / (5 * 4.189);  // Q [caudal] = (potencia frig * constante[3.6]) / (At[5º] * constante[4.189])
			}

			datosVerificacion.compresores = result[0]["2"];
			datosVerificacion.consumo_nominal_frio = result[0]["3"];
			datosVerificacion.consumo_nominal_calor = result[0]["4"];
			datosVerificacion.potencia_frig_frio = result[0]["6"];
			datosVerificacion.potencia_frig_calor = result[0]["5"],
			datosVerificacion.caudal_aire_cond = result[0]["8"];
			datosVerificacion.caudal_aire_evap = result[0]["7"];
			datosVerificacion.ventiladores_ext = result[0]["9"];
			datosVerificacion.ventiladores_int = result[0]["9"];
			datosVerificacion.circuitos = result[0]["11"];
			datosVerificacion.observaciones = result[0]["12"].replace(/:/g, ':<br />').replace(/\n/g, "<br />");
			datosVerificacion.observacionesTecnicas = result[0]["13"].replace(/\n/g, "<br />");
			datosVerificacion.kgrRefrigerante = result[0]["17"];
	

			switch (result[0]["14"]) {
				case 'R-410A':
					datosVerificacion.refrigerante = 4;
					break;
				
				case 'R-32':
					datosVerificacion.refrigerante = 22;
					break;
			
				case 'R-407C':
					datosVerificacion.refrigerante = 3;
					break;
			
				case 'R-290':
					datosVerificacion.refrigerante = 6;
					break;
		
				default:
					datosVerificacion.refrigerante = 0;
					break;
			}

			if (result[0]["15"] === 'F') datosVerificacion.soloFrio = 1;
			if (result[0]["15"] === 'B') datosVerificacion.soloFrio = 0;
		
			// Ventilador C = centifugo, X = Axial, N = Ambos(Axial y Centrifugo), S = Sin Ventilador
			datosVerificacion.tipoVentilacion = result[0]["16"];

		}

		/************************************************************************************************** */
		/**																																																	*/
		/**				LLama a la función que se encarga de leer los componentes que lleva el										*/
		/**				equipo a verificar.																																				*/
		/**	 																																																*/
		/****************************************************************************************************/

		APP.debug ? console.log('     - Datos Técnicos guardados en extructura, se procede a consulta de componentes del equipo.') : '';
		getProductionData();
	});
}



















/******************************************************************************************************** */
/**																																																				*/
/**		@function: Privada																																									*/
/**		@description: Consulta a la tabla [HITPRODLISTADOSTRANS] para extraer componentes del equipo.			 	*/
/**									Esta función es llamada por su predecesora "getTechnicalData()".											*/
/**																																																				*/
/**	 																																																			*/
/******************************************************************************************************** */

const getProductionData = () => {

	let params = [];
	let sql = 'SELECT ITEMID, ITEMNAME, QTY, NIVEL FROM HITPRODLISTADOSTRANS WHERE INVENTSERIALID = @nserie';
	
	Axapta.buildParams(params, 'nserie', TYPES.VarChar, numSerieEquipo);
	Axapta.query(params, sql, result => {
		
		

		/************************************************************************************************** */
		/**																																																	*/
		/**				Respuesta de la consulta: de los datos recibidos, obtenemos:															*/
		/**					Identificador del elemento  																														*/
		/**				 	Nombre del elemento																																			*/
		/**					Cantidad del elemento																																		*/
		/**					Nivel al que pertenece el elemento 	2 = Opcionales																			*/
		/**																							3 = Elementos Cuadro																*/
		/**																							4 = Elementos Electricos														*/
		/**																					resto = Resto de elementos del equipo										*/
		/**																																																	*/
		/**				Recupera todos los elementos que incluye la máquina, ( lo mismo que en las hojas de 			*/
		/**				producción )																																							*/
		/**	 																																																*/
		/**	 			Filtramos el resultado llamando a la función que revisará elemento a elemento y lo 				*/
		/**				añadirá a la extructura "datosVerificación" 																							*/
		/**	 																																																*/
		/****************************************************************************************************/
		
		result.find((item) => buildDataVerification(item));

		APP.debug ? console.log('     - Construida la hoja de "datosVerificacion", con todos los componentes.') : '';
		getDataVariations();
	});

}


















/******************************************************************************************************** */
/**																																																				*/
/**		@function: Privada																																									*/
/**		@description: Formula consulta a multiples tablas para extraer las variaciones del equipo.				 	*/
/**									Esta función es llamada por su predecesora "getProductionData()".											*/
/**																																																				*/
/**	 																																																			*/
/******************************************************************************************************** */

const getDataVariations = () => {

	let params = [];
	let sql = 'SELECT * FROM Planning_with_times INNER JOIN HITVARIANTESCONFIG ON HITVARIANTESCONFIG.ITEMID = Planning_with_times.ITEMID AND HITVARIANTESCONFIG.CONFIGID = Planning_with_times.CONFIGID INNER JOIN HITVARIACIONES ON HITVARIACIONES.HITVARIANTEID = HITVARIANTESCONFIG.HITVARIANTEID AND HITVARIACIONES.HITVARIANTEGROUPID = Planning_with_times.HITVARIANTEGROUPID WHERE INVENTSERIALID = @nserie';

	Axapta.buildParams(params, 'nserie', TYPES.VarChar, numSerieEquipo);
	Axapta.query(params, sql, variaciones => {
		
		variaciones.find((variacion) => {
			variacion['27'].indexOf('Recuperador CALOR Parcial') !== -1 ? datosVerificacion.recuperadorCalor = 1 : '';
			variacion['27'].indexOf('Presostato diferencial de Agua') !== -1 ? datosVerificacion.pdp = 1 : '';
			variacion['27'].indexOf('Sonda Ambiente de Pared') !== -1 ? datosVerificacion.sondaRetorno = 1 : '';
			variacion['27'].indexOf('Sonda Retorno') !== -1 ? datosVerificacion.sondaRetorno = 1 : '';
			variacion['27'].indexOf('Sonda de Impulsión (NTC)') !== -1 ? datosVerificacion.sondaimpulsionNTC = 1 : '';
			variacion['27'].indexOf('Preparado Sonda IMPULSION') !== -1 ? datosVerificacion.sondaimpulsionNTC = 1 : '';
			variacion['27'].indexOf('PRESOSTATICA V2V PROP') !== -1 ? datosVerificacion.controlCondensacion = 1 : '';
			variacion['27'].indexOf('PRESOSTATICA V3V PROP') !== -1 ? datosVerificacion.controlCondensacion = 1 : '';
			variacion['27'].indexOf('Mando PGD') !== -1 ? datosVerificacion.terminalPGD = 1 : '';
			variacion['27'].indexOf('PRE.REG.PKD') !== -1 ? datosVerificacion.PKDT = 1 : '';
			variacion['27'].indexOf('Mando Mini-PGD (sin TH-Tune)') !== -1 ? (datosVerificacion.terminalMiniPGD = 1, datosVerificacion.terminalTHTUNE = 0) : ''; 
			variacion['27'].indexOf('Otros/Especial. Exportación') !== -1 ? datosVerificacion.idioma = 0 : '';
		});

		for (let e = 0; e < variaciones.length; e++) {
			datosVerificacion.variaciones.push({
				variante: variaciones[e]['28'],
				descripcion: variaciones[e]['27'],
				observaciones: variaciones[e]['40']
			})
		}

		APP.debug ? console.log('     - Modificación según las variaciones encontradas.') : '';
		getDataRevocation();
	});

}

















/******************************************************************************************************** */
/**																																																				*/
/**		@function: Privada																																									*/
/**		@description: Formula varias consultas a tablas para añadir o eliminar elementos del equipo.			 	*/
/**									Esta función es llamada por su predecesora "getDataVariations()".											*/
/**																																																				*/
/**	 																																																			*/
/******************************************************************************************************** */

const getDataRevocation = () => {

	let elementosQuitar = [];

	let parametros = [];
	let sql = 'SELECT SALESID, HITDEROGACIONID FROM HITDEROGACIONESMAQUINAS WHERE INVENTSERIALID = @nserie';

	Axapta.buildParams(parametros, 'nserie', TYPES.VarChar, numSerieEquipo);
	Axapta.query(parametros, sql, result => {
		
		if (result.length > 0) {

			let idDerogacion = result[0]['1'];
			datosVerificacion.pvn = result[0]['0'].trim();
			
			let params2 = [];
			let sql2 = 'SELECT HITDEROGACIONID, QTY, ITEMID, ITEMNAME FROM HITDEROGACIONESTRANSDESDE WHERE HITDEROGACIONID = @idDerogacion';

			Axapta.buildParams(params2, 'idDerogacion', TYPES.Int, idDerogacion);
			Axapta.query(params2, sql2, quitar => {
				
				datosVerificacion.derogaciones = { id: quitar[0]['0'] };

				/** Solo para informar de los elemetos que se quitan */
				for (let i = 0; i < quitar.length; i++) {
					elementosQuitar.push({ 0: quitar[i]['2'], 1: quitar[i]['3'], 2: quitar[i]['1'] });
				}

				datosVerificacion.derogaciones.quitar = elementosQuitar;

				/** Gestion para eliminar o poner a 0 los componentes que se quitan (solo los que afectan a la verificación automática) */
				elementosQuitar.find((del) => {
					buildDataVerification(del);
				})


				let sql3 = 'SELECT HITDEROGACIONID, QTY, ITEMID, ITEMNAME FROM HITDEROGACIONESTRANSHASTA WHERE HITDEROGACIONID = @idDerogacion';

				let elementosAdd = [];

				Axapta.query(params2, sql3, anyadir => {

					for (let o = 0; o < anyadir.length; o++) {
						elementosAdd.push({
							0: anyadir[o]['2'],
							1: anyadir[o]['3'],
							2: anyadir[o]['1']
						});	
					}

					datosVerificacion.derogaciones.anyadir = elementosAdd ;

					elementosAdd.find((add) => {
						buildDataVerification(add);
					});

					APP.debug ? console.log('     - Derogaciones eliminadas y añadidas a la extructura.') : '';
					APP.debug ? console.log('     - Extructura creada y envidada al cliente.') : '';
					APP.debug ? console.log(' ') : '';
					toClient('resEquip', datosVerificacion);
				});
				
			}); 
			
		} else {

			APP.debug ? console.log('     - No existen derogaciones.') : '';
			APP.debug ? console.log('     - Extructura creada y envidada al cliente.') : '';
			APP.debug ? console.log(' ') : '';
			toClient('resEquip', datosVerificacion);
		}
	});

}















/******************************************************************************************************** */
/**																																																				*/
/**		@function: Privada																																									*/
/**		@description: Formula varias consultas a tablas para añadir o eliminar elementos del equipo.			 	*/
/**									Esta función es llamada por "getDataRevocation()" y "getProductionData()"							*/
/**																																																				*/
/**	 																																																			*/
/******************************************************************************************************** */

const buildDataVerification = (componente) => {

	let codigo 			= "" + componente["0"] + "";	// codigo axpata
	let descripcion = "" + componente["1"] + "";  // descripcion
	let cantidad 		= componente["2"];						// cantidad
	




	/****************************************************************************************************** */
	/** 																																																		*/
	/**		@description: A la función se le pasa como parámetro el codigo que tiene el componente en Axapta	*/
	/**									lo busca en el archivo "componentes.json", y si lo encuentra, añadimos datos				*/
	/**									como la potencia, intensidad, nombre y modelo, a la estructura "datosVerificacion"	*/
	/** 																																																		*/
	/**		@param: String (codigo) 																																					*/
	/** 																																																		*/
	/****************************************************************************************************** */

	const addComponent = ((codigoAxapta) => {

		try {

			let compte = componentes.getData('/' + codigoAxapta);

			compte.name === 'compresor' ? (datosVerificacion.compresor.push({ ...compte, ...{codigo: codigoAxapta}})) : '';
			compte.name === 'radial' ? (datosVerificacion.radial.push({ ...compte, ...{codigo: codigoAxapta}})) : '';
			compte.name === 'axial' ? (datosVerificacion.axial.push({ ...compte, ...{codigo: codigoAxapta}})) : '';
			compte.name === 'bomba' ? (datosVerificacion.bomba.push({ ...compte, ...{codigo: codigoAxapta}})) : '';
			compte.name === 'motor' ? (datosVerificacion.motor.push({ ...compte, ...{codigo: codigoAxapta}})) : '';
			compte.name === 'turbina' ? (datosVerificacion.turbina.push({ ...compte, ...{codigo: codigoAxapta}})) : '';
			// Envelope del compresor
			compte.name === 'compresor' && compte.envelope != '' ? (datosVerificacion.envelop = dbC.getData('/' + compte.envelope)) : '';
			
		} catch (error) {
			APP.debug ? console.log('Error de lectura del archivo componentes.json', error) : '';
		}
	})










	/************     Compresores     *******************************************************************************************************************************************/
	COMPONENTE.compresor.forEach(comp => {
		// Si el compresor esta en el listado y la propiedad cantidad es >= 1 --> añadimos al array los datos buscados,
		// Si el compresor esta en el listado y la propiedad cantidad es < 1 --> vaciamos el array
		codigo.indexOf(comp) !== -1 ? cantidad >= 1 ? addComponent(codigo) : datosVerificacion.compresor = [] : '';
	});
	/*****************************************************************************************************************************************     Fin Compresores     **********/



	/************     Ventiladoes Radiales (Evaporador)     *********************************************************************************************************************/
	COMPONENTE.ventRadial.forEach(rad => {
		// Si el ventilador radial (evaporador) esta en el listado y la propiedad cantidad es >= 1 --> añadimos al array los datos buscados, 
		// Si el ventilador radial (evaporador) esta en el listado y la propiedad cantidad es < 1 --> vaciamos el array
		codigo.indexOf(rad) !== -1 ? cantidad >= 1 ? addComponent(codigo) : datosVerificacion.radial = [] : '';	
	});
	/*******************************************************************************************************************************     Fin Ventiladores Radiales     **********/



	/************     Ventiladores Axiales (Condensador)     ********************************************************************************************************************/
	COMPONENTE.ventAxial.forEach(axi => {
		// Si el ventilador axial (condensador) esta en el listado y la propiedad cantidad es >= 1 --> añadimos al array los datos buscados, 
		// Si el ventilador axial (condensador) esta en el listado y la propiedad cantidad es < 1 --> vaciamos el array
		codigo.indexOf(axi) !== -1 ? cantidad >= 1 ? addComponent(codigo) : datosVerificacion.axial = [] : '';	
	});
	/*********************************************************************************************************************************     Fin Ventiladoes Axiales     **********/



	/************     Bombas     ************************************************************************************************************************************************/
	COMPONENTE.bombaAgua.forEach(bomb => {
		// Si la bomba de agua esta en el listado y la propiedad cantidad es >= 1 --> añadimos al array los datos buscados, 
		// Si la bomba de agua esta en el listado y la propiedad cantidad es < 1 --> vaciamos el array
		codigo.indexOf(bomb) !== -1 ? cantidad >= 1 ? addComponent(codigo) : datosVerificacion.bomba = [] : '';	
	});
	/**********************************************************************************************************************************************     Fin Bombas     **********/



	/************     Motores     ***********************************************************************************************************************************************/
	COMPONENTE.ventMotor.forEach(motor => {
		// Si motor esta en el listado y la propiedad cantidad es >= 1 --> añadimos al array los datos buscados, 
		// Si motor esta en el listado y la propiedad cantidad es < 1 --> vaciamos el array
		codigo.indexOf(motor) !== -1 ? cantidad >= 1 ? addComponent(codigo) : datosVerificacion.motor = [] : '';	
	});
	/*********************************************************************************************************************************************     Fin Motores     **********/



	/************     Turbinas     **********************************************************************************************************************************************/
	COMPONENTE.ventTurbina.forEach(turb => {
		// Si la turbina esta en el listado y la propiedad cantidad es >= 1 --> añadimos al array los datos buscados, 
		// Si la turbina esta en el listado y la propiedad cantidad es < 1 --> vaciamos el array
		codigo.indexOf(turb) !== -1 ? cantidad >= 1 ? addComponent(codigo) : datosVerificacion.turbina = [] : '';	
	});
	/********************************************************************************************************************************************     Fin Turbinas     **********/



	/************     Terminales     ********************************************************************************************************************************************/
	codigo.indexOf(COMPONENTE.pgd) !== -1 ? cantidad >= 1 ? datosVerificacion.terminalPGD = 1 : datosVerificacion.terminalPGD = 0 : '';
	codigo.indexOf(COMPONENTE.miniPGD) !== -1 ? cantidad >= 1 ? datosVerificacion.terminalMiniPGD = 1 : datosVerificacion.miniPGD = 0 : '';
	codigo.indexOf(COMPONENTE.thtune) !== -1 ? cantidad >= 1 ? datosVerificacion.terminalTHTUNE = 1 : datosVerificacion.terminalTHTUNE = 0 : '';
	/******************************************************************************************************************************************     Fin Terminales     **********/



	/************     Variadores     ********************************************************************************************************************************************/
	descripcion.indexOf('PRE.REG.PKD') !== -1 ? cantidad >= 1 ? datosVerificacion.PKDT = 1 : datosVerificacion.PKDT = 0 : '';
	/******************************************************************************************************************************************     Fin Variadores     **********/



	/************     Kit Hidronico (Dep. Inercia)     **************************************************************************************************************************/ 
	descripcion.indexOf('DEP.INERCIA') !== -1 ? datosVerificacion.kitHidronico = 1 : '';
	/***************************************************************************************************************************************     Fin Kit Hidronico     **********/



	/************     Secuenciador Fases     ************************************************************************************************************************************/ 
	descripcion.indexOf('SEQ. FASES') !== -1 ? datosVerificacion.seqFases = 1 : '';
	/**********************************************************************************************************************************     Fin Sequenciador Fases     **********/



	/************     Resistencia Electica Apoyo     ****************************************************************************************************************************/ 
	descripcion.indexOf('BE ') !== -1 ? (datosVerificacion.resisitenciaAire = 1, datosVerificacion.numResistenciasElec = cantidad) : '';
	/*************************************************************************************************************************     Fin Resistencia Electrica Apoyo     **********/



	/************    Gestion Resistencias Carter     ****************************************************************************************************************************/

	// Si existe "resistencia carter" y el datosor de la propiedad "cantidad" es mayor o iugual a 1 --> añadimos elemento al array "resistenciasCarter"
	// Si existe "resistencia carter" y el datosor de la propiedad "cantidad" es menor o iugual a 0  --> vaciaamos array []
	descripcion.indexOf("CARTER") !== -1  ? resistenciasCarter.push(elemento) : ''; 
	descripcion.indexOf("RES.CAR.") !== -1 ? resistenciasCarter.push(elemento) : ''; 
	


	if (resistenciasCarter.length === 1) {
		// un registro encotrado con una o mas como cantidad,
		resistenciasCarter[0]["2"] === 1 ? resCarterComp1 = resistenciasCarter[0]["1"].substr(resistenciasCarter[0]["1"].indexOf('W') - 3, 3).trim() : '';

		resistenciasCarter[0]["2"] === 2 ?
		(
			resCarterComp1 = resistenciasCarter[0]["1"].substr(resistenciasCarter[0]["1"].indexOf('W') - 3, 3).trim(),
			resCarterComp2 = resCarterComp1
		) : '';
			
		resistenciasCarter[0]["2"] === 4 ?
		(
			resCarterComp1 = resistenciasCarter[0]["1"].substr(resistenciasCarter[0]["1"].indexOf('W') - 3, 3).trim(),
			resCarterComp2 = resCarterComp1,
			resCarterComp3 = resCarterComp1,
			resCarterComp4 = resCarterComp1
		) : '';
	}
		


	if (resistenciasCarter.length === 2) {
		resistenciasCarter[0]["2"] == 1 ?
			(
				resCarterComp1 = resistenciasCarter[0]["1"].substr(resistenciasCarter[0]["1"].indexOf('W') - 3, 3).trim(),
				resCarterComp2 = resistenciasCarter[1]["1"].substr(resistenciasCarter[1]["1"].indexOf('W') - 3, 3).trim()
			) : '';
			
		resistenciasCarter[0]["2"] == 2 ?
			(
				resCarterComp1 = resistenciasCarter[0]["1"].substr(resistenciasCarter[0]["1"].indexOf('W') - 3, 3).trim(),
				resCarterComp3 = resCarterComp1,
				resCarterComp2 = resistenciasCarter[1]["1"].substr(resistenciasCarter[1]["1"].indexOf('W') - 3, 3).trim(),
				resCarterComp4 = resCarterComp2
			) : '';
	}



	resCarterComp1 !== undefined ? datosVerificacion.resistCarter.comp1 = parseFloat(resCarterComp1) : '';
	resCarterComp2 !== undefined ? datosVerificacion.resistCarter.comp2 = parseFloat(resCarterComp2) : '';
	resCarterComp3 !== undefined ? datosVerificacion.resistCarter.comp3 = parseFloat(resCarterComp3) : '';
	resCarterComp4 !== undefined ? datosVerificacion.resistCarter.comp4 = parseFloat(resCarterComp4) : '';

	/************************************************************************************************************************     FIN  Gestion Resistencias Carter     *********/



	/************   Gestion Resistencias Antihielo    **************************************************************************************************************************/
		
	descripcion.indexOf('RESISTENCIA ANTIHIELO') !== -1 ? cantidad >= 1 ? resistenciasHielo.push(elemento) : resistenciasHielo = [] : ''; 

	if (resistenciasHielo.length === 1) {
		datosVerificacion.resistHielo = {
			watios: resistenciasHielo[0]["1"].substr(resistenciasHielo[0]["1"].indexOf('W') - 4, 3).trim(),
			numResistencias: resistenciasHielo[0]["2"]
		}
	}
	/************************************************************************************************************************     Fin Gestion Resistencias Antihielo   *********/



	/***********    Gestion Bombas Agua  + transdutor agua     *****************************************************************************************************************/
	
	//descripcion.indexOf('BOMBA AGUA') !== -1 ? bombas.push(elemento) : ''; 
	//descripcion.indexOf('B. AGUA') !== -1 ? bombas.push(elemento) : ''; 
			
	COMPONENTE.transductor_agua.forEach(transAgua => {
		transAgua.indexOf(elemento["0"]) !== -1 ? datosVerificacion.presionAgua = 1 : ''
	});

	//for (let i = 0; i < bombas.length; i++) {
		//datosVerificacion.numbombas =+ bombas[i]["2"];
	datosVerificacion.numbombas = datosVerificacion.bomba.length;
	//}

	//datosVerificacion.numbombas > 1 || datosVerificacion.numEquip === 5 || datosVerificacion.numEquip === 6 ? datosVerificacion.rotacionBombas = 1 : '';
	datosVerificacion.numbombas > 1 ? datosVerificacion.rotacionBombas = 1 : '';

	/******************************************************************************************************************************    Fin Gestion Bombas Agua    *************/



	/***********    medidor  enrgeia     **************************************************************************************************************************************/
		
	COMPONENTE.medidorEnergia.forEach(med => {
		codigo.indexOf(med) !== -1 ? cantidad >= 1 ? datosVerificacion.medidorEnergia = 1 : datosVerificacion.medidorEnergia = 0 : '';
	});

	COMPONENTE.toroidal.forEach(tor => {
		codigo.indexOf(tor) !== -1 ? cantidad >= 1 ? toroidales = elemento["2"] : toroidales = 0 : ''
	});


	toroidales === 1 ? datosVerificacion.medidorMono = 1 : toroidales >= 2 ? datosVerificacion.medidorTri = 1 : '';

	/********************************************************************************************************************************     Fin medidor energia     ************/



	/*********   Gestion Termicos Proteccion   *******************************************************************************************************************************/
		
	descripcion.indexOf('RELE TER') !== -1 ? termicos.push(elemento) : ''; 
		// WPH
	if (datosVerificacion.numEquip === 1) {
		termicos.length === 1 ? datosVerificacion.habTermicoVentInt = 1 : '';
	}
		// Kr3
	if (datosVerificacion.numEquip === 3) { 
		termicos.length === 2 ? datosVerificacion.habTermicoCompresores = 1  : '';
		termicos.length >= 3 ? (datosVerificacion.habTermicoBombas = 1, datosVerificacion.habTermicoCompresores = 1 ) : '';
	}
		// uKr3
	if (datosVerificacion.numEquip === 4) {
		termicos.length === 1 ? datosVerificacion.habTermicoBombas = 1 : '';
	}
	datosVerificacion.listTermicos = termicos;
	/**********************************************************************************************************************  Fin Gestion Termicos Proteccion   ***************/



	/*********   Gestion Presostatos      ************************************************************************************************************************************/

	codigo === '063816' ? cantidad >= 1 ? datosVerificacion.presostatos.pr_alta45_rm = 1 : datosVerificacion.presostatos.pr_alta45_rm = 0 : '';  		// 45
	codigo === '063172' ? cantidad >= 1 ? datosVerificacion.presostatos.pr_alta42_ra = 1 : datosVerificacion.presostatos.pr_alta42_ra = 0 : '';  		// 42-33
	codigo === '063173' ? cantidad >= 1 ? datosVerificacion.presostatos.pr_alta42_rm = 1 : datosVerificacion.presostatos.pr_alta42_rm = 0 : '';  		// 42-33
	codigo === '063174' ? cantidad >= 1 ? datosVerificacion.presostatos.pr_baja4ra = 1 : datosVerificacion.presostatos.pr_baja4ra = 0 : '';	  			// 4-6
	codigo === '063126' ? cantidad >= 1 ? datosVerificacion.presostatos.pr_kp = 1 : datosVerificacion.presostatos.pr_kp = 0 : '';
	codigo === '063105' ? cantidad >= 1 ? datosVerificacion.presostatos.pr_alta29 = 1 : datosVerificacion.presostatos.pr_alta29 = 0 : '';			  		// 29-19
	codigo === '063106' ? cantidad >= 1 ? datosVerificacion.presostatos.pr_baja27 = 1 : datosVerificacion.presostatos.pr_baja27 = 0 : '';						// 2.7-3.7
	codigo === '063175' ? cantidad >= 1 ? datosVerificacion.presostatos.pr_baja24 = 1 : datosVerificacion.presostatos.pr_baja24 = 0 : '';  					// 2.4-4.1
	codigo === '063194' ? cantidad >= 1 ? datosVerificacion.presostatos.pr_baja45 = 1 : datosVerificacion.presostatos.pr_baja45 = 0 : ''; 			 		// 4.5-6.0
	codigo === '063133' ? cantidad >= 1 ? datosVerificacion.presostatos.pr_desescarche = 1 : datosVerificacion.presostatos.pr_desescarche = 0 : '';	// 33-28

	/**************************************************************************************************************************   FIN Gestion Presostatos      ***************/



	/*********     Gestion datosvula 2 o 3 vias (solo WPH)     *****************************************************************************************************************/
	if (datosVerificacion.numEquip === 1) {

		COMPONENTE.datosvXviasProporcional.forEach(datosv => {
			codigo.indexOf(datosv) !== -1 ? cantidad >= 1 ? controlCondensacion = true : controlCondensacion = false : '';
		});
			
		COMPONENTE.transductor_0_45.forEach(element => {
			codigo.indexOf(element) !== -1 ? cantidad >= 1 ? transductor = true : transductor = false : '';
		});

		// Si elementos datosvula 2 o 3 VIAS + transductor de 0 - 45 bar estan presentes, habilitar control condensación, si solo
		// se encuentra datosvula 2 o 3 VIAS habilita la datosvula de corte.
		controlCondensacion && transductor ? (datosVerificacion.controlCondensacion = 1, datosVerificacion.datosvulaCorte = 0) : controlCondensacion && !transductor ? (datosVerificacion.datosvulaCorte = 1, datosVerificacion.controlCondensacion = 0) : '';
	}
	/*******************************************************************************************************************    FIN Gestion datosvula 2 o 3 vias   ****************/


}

















module.exports = {
	getEquipo,
	setEquipo
};