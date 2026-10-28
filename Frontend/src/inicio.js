const UMBRAL_CONDUCTIVIDAD = { bajo: 200, alto: 2000 };
const UMBRAL_HUMEDAD = { bajo: 30, alto: 70 };
const UMBRAL_TEMPERATURA = { bajo: 15, alto: 32 };

// Los mismos colores para todos los sensores.
const COLORES_ESTADO = {
  Bajo: '#3498db',
  'Óptimo': '#27ae60',
  Alto: '#e74c3c',
  'Sin datos': '#7f8c8d'
};

function calcularEstadoConductividad(valor) {
  if (valor < UMBRAL_CONDUCTIVIDAD.bajo) return 'Bajo';
  if (valor > UMBRAL_CONDUCTIVIDAD.alto) return 'Alto';
  return 'Óptimo';
}

function calcularEstadoHumedad(valor) {
  if (valor < UMBRAL_HUMEDAD.bajo) return 'Bajo';
  if (valor > UMBRAL_HUMEDAD.alto) return 'Alto';
  return 'Óptimo';
}

function calcularEstadoTemperatura(valor) {
  if (valor < UMBRAL_TEMPERATURA.bajo) return 'Bajo';
  if (valor > UMBRAL_TEMPERATURA.alto) return 'Alto';
  return 'Óptimo';
}

async function cargarNombreUsuario() {
  try {
    const res = await fetchProtegido('http://localhost:3000/api/usuarios/perfil');
    if (!res || !res.ok) return;
    const datos = await res.json();
    const elNombre = document.getElementById('nombre-usuario-inicio');
    if (elNombre) elNombre.textContent = datos.nombre;
  } catch (error) {
    console.error('Error cargando el nombre del usuario:', error);
  }
}

function actualizarSensorInicio(idValor, idConclusion, valorOriginal, unidad, calcularEstado, textos) {
  const elValor = document.getElementById(idValor);
  const elConclusion = document.getElementById(idConclusion);
  const valor = Number(valorOriginal);
  const valido = valorOriginal !== null && valorOriginal !== undefined &&
    valorOriginal !== '' && Number.isFinite(valor) &&
    !(idValor === 'valor-temperatura' && valor === -127);

  const estado = valido ? calcularEstado(valor) : null;
  const color = COLORES_ESTADO[estado || 'Sin datos'];

  if (elValor) {
    elValor.textContent = valido ? `${valor} ${unidad}` : 'Sin datos';
    elValor.style.color = color;
  }
  if (elConclusion) {
    elConclusion.textContent = valido ? textos[estado] : 'Sin conexión';
    elConclusion.style.color = color;
  }
  return estado;
}

async function cargarSensoresInicio() {
  try {
    const resUltimo = await fetchProtegido('http://localhost:3000/api/sensores/ultimo');
    if (!resUltimo) return;
    const ultimo = await resUltimo.json();

    if (!resUltimo.ok || !ultimo || ultimo.mensaje) {
      console.warn('No se pudieron obtener los datos de los sensores.');
      return;
    }

    const estadoCond = actualizarSensorInicio(
      'valor-conductividad', 'conclusion-conductividad', ultimo.conductividad,
      'µS/cm', calcularEstadoConductividad,
      { Bajo: '¡Bajo!', 'Óptimo': '¡Rango Saludable!', Alto: '¡Alto!' }
    );

    const estadoTemp = actualizarSensorInicio(
      'valor-temperatura', 'conclusion-temperatura', ultimo.temperaturaBME280,
      '°C', calcularEstadoTemperatura,
      { Bajo: '¡Frío!', 'Óptimo': '¡Perfecto!', Alto: '¡Calor!' }
    );

    const estadoHum = actualizarSensorInicio(
      'valor-humedad', 'conclusion-humedad', ultimo.humedadSuelo,
      '%', calcularEstadoHumedad,
      { Bajo: '¡Seco!', 'Óptimo': '¡Ideal!', Alto: '¡Húmedo!' }
    );

    const textoSaludGeneral = document.querySelector('.contenido-izquierdo .info');
    const subtitulos = document.querySelectorAll('.subtitulo-estado');
    const subtituloCrecimiento = subtitulos[0];
    const subtituloCondiciones = subtitulos[1];
    const subtituloUltimaMedicion = subtitulos[2];

    const estados = [estadoCond, estadoTemp, estadoHum].filter(e => e !== null);
    const todosOptimos = estados.length === 3 && estados.every(e => e === 'Óptimo');
    const hayProblemas = estados.some(e => e === 'Bajo' || e === 'Alto');

    if (todosOptimos) {
      if (textoSaludGeneral) textoSaludGeneral.textContent =
        'Tu planta se encuentra en un rango saludable. Todos los parámetros están estables.';
      if (subtituloCrecimiento) {
        subtituloCrecimiento.textContent = 'Estable';
        subtituloCrecimiento.style.color = '#27ae60';
      }
      if (subtituloCondiciones) {
        subtituloCondiciones.textContent = 'Ideales';
        subtituloCondiciones.style.color = '#27ae60';
      }
    } else if (hayProblemas) {
      if (textoSaludGeneral) textoSaludGeneral.textContent =
        'Atención: algunos parámetros están fuera del rango recomendado. Revisá los detalles.';
      if (subtituloCrecimiento) {
        subtituloCrecimiento.textContent = 'En revisión';
        subtituloCrecimiento.style.color = '#e74c3c';
      }
      if (subtituloCondiciones) {
        subtituloCondiciones.textContent = 'Alerta';
        subtituloCondiciones.style.color = '#e74c3c';
      }
    } else {
      if (textoSaludGeneral) textoSaludGeneral.textContent =
        'Esperando lecturas completas de los sensores para evaluar la salud.';
      if (subtituloCrecimiento) {
        subtituloCrecimiento.textContent = 'Calculando';
        subtituloCrecimiento.style.color = '#7f8c8d';
      }
      if (subtituloCondiciones) {
        subtituloCondiciones.textContent = 'Pendiente';
        subtituloCondiciones.style.color = '#7f8c8d';
      }
    }

    const fechaObj = new Date(ultimo.timestamp || ultimo.fecha || ultimo.createdAt);
    if (subtituloUltimaMedicion && !Number.isNaN(fechaObj.getTime())) {
      const opcionesFecha = {
        timeZone: 'America/Argentina/Buenos_Aires',
        hour: '2-digit', minute: '2-digit', hour12: false
      };
      const horaArgentina = new Intl.DateTimeFormat('es-AR', opcionesFecha).format(fechaObj);
      const opcionesSoloFecha = {
        timeZone: 'America/Argentina/Buenos_Aires',
        year: 'numeric', month: '2-digit', day: '2-digit'
      };
      const fechaArgentinaStr = new Intl.DateTimeFormat('es-AR', opcionesSoloFecha).format(fechaObj);
      const hoyArgentinaStr = new Intl.DateTimeFormat('es-AR', opcionesSoloFecha).format(new Date());
      const esHoy = fechaArgentinaStr === hoyArgentinaStr;
      subtituloUltimaMedicion.textContent = esHoy
        ? `Hoy, ${horaArgentina}`
        : `${fechaArgentinaStr}, ${horaArgentina}`;
    }
  } catch (error) {
    console.error('Error cargando los sensores en el inicio:', error);
  }
}

function cerrarSesion() {
  localStorage.removeItem('token');
  window.location.href = '4. iniciar-sesion.html';
}

cargarNombreUsuario();
cargarSensoresInicio();
setInterval(cargarSensoresInicio, 15 * 60 * 1000);