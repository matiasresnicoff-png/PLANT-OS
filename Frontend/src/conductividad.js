const UMBRAL_CONDUCTIVIDAD = { bajo: 200, alto: 2000 };
const ESCALA_CONDUCTIVIDAD = 3000;

function formatearHoraArgentina(timestampUTC) {
  return new Date(timestampUTC).toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatearHoraCorta(timestampUTC) {
  return new Date(timestampUTC).toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function calcularEstadoConductividad(valor) {
  if (valor < UMBRAL_CONDUCTIVIDAD.bajo) return 'Bajo';
  if (valor > UMBRAL_CONDUCTIVIDAD.alto) return 'Alto';
  return 'Óptimo';
}

function recomendacionConductividad(estado) {
  if (estado === 'Bajo') return 'Hay pocos nutrientes en la tierra. Te recomendamos fertilizar la planta.';
  if (estado === 'Alto') return 'Hay exceso de nutrientes/sales en la tierra. Te recomendamos regar para diluir y evitar fertilizar por ahora.';
  return 'El nivel de nutrientes en la tierra está en un rango óptimo.';
}

async function cargarConductividad() {
  const elValor = document.getElementById('valor-conductividad');
  const elEstado = document.getElementById('estado-conductividad');
  const elRecomendacion = document.getElementById('recomendacion-conductividad');
  const elUltimaLectura = document.getElementById('ultima-lectura-conductividad');

  if (elValor) elValor.textContent = 'Cargando...';
  if (elRecomendacion) elRecomendacion.textContent = '';
  if (elUltimaLectura) elUltimaLectura.textContent = '';

  try {
    const resUltimo = await fetchProtegido('http://localhost:3000/api/sensores/ultimo');
    if (!resUltimo) return;
    const ultimo = await resUltimo.json();

    if (!resUltimo.ok) {
      if (elValor) elValor.textContent = '--';
      if (elEstado) elEstado.textContent = 'Error';
      if (elRecomendacion) elRecomendacion.textContent = ultimo.error || 'No se pudo obtener los datos.';
      return;
    }

    if (ultimo.mensaje) {
      if (elValor) elValor.textContent = '--';
      if (elEstado) elEstado.textContent = 'Sin datos';
      if (elRecomendacion) elRecomendacion.textContent = 'Todavía no hay mediciones. Esperá a que el sensor mande datos.';
      return;
    }

    const valor = ultimo.conductividad;

    if (valor === null) {
      if (elValor) elValor.textContent = 'Sin datos';
      if (elEstado) elEstado.textContent = 'Sin datos';
      if (elRecomendacion) elRecomendacion.textContent = 'El sensor de conductividad todavía no está conectado.';
      return;
    }

    if (elValor) elValor.textContent = valor + ' µS/cm';

    const estado = calcularEstadoConductividad(valor);
    if (elEstado) elEstado.textContent = estado;
    if (elRecomendacion) elRecomendacion.textContent = recomendacionConductividad(estado);
    if (elUltimaLectura) elUltimaLectura.textContent = 'Última lectura: ' + formatearHoraArgentina(ultimo.timestamp) + ' hs. Arg.';

    const resHistorial = await fetchProtegido('http://localhost:3000/api/sensores');
    if (!resHistorial) return;
    const historial = await resHistorial.json();
    dibujarGrafico(historial);
  } catch (error) {
    console.error('Error cargando datos de conductividad:', error);
    if (elValor) elValor.textContent = '--';
    if (elEstado) elEstado.textContent = 'Error';
    if (elRecomendacion) elRecomendacion.textContent = 'No se pudo conectar con el servidor. Revisá que el backend esté corriendo.';
  }
}

function dibujarGrafico(historial) {
  const contenedor = document.getElementById('grafico-conductividad');
  if (!contenedor) return;

  contenedor.innerHTML = '';
  contenedor.style.display = 'flex';
  contenedor.style.flexDirection = 'column';
  contenedor.style.width = '100%';
  contenedor.style.height = '100%';
  contenedor.style.boxSizing = 'border-box';
  contenedor.style.padding = '12px 16px 8px 12px';

  const areaGrafico = document.createElement('div');
  areaGrafico.style.position = 'relative';
  areaGrafico.style.flex = '1';
  areaGrafico.style.display = 'flex';
  areaGrafico.style.alignItems = 'flex-end';
  areaGrafico.style.marginLeft = '36px';
  areaGrafico.style.borderBottom = '1px solid #e0e0e0';
  contenedor.appendChild(areaGrafico);

  // Eje Y (0%, 25%, 50%, 75%, 100%)
  for (let i = 0; i <= 4; i++) {
    const porcentajePosicion = i * 25;
    const valorLinea = Math.round((ESCALA_CONDUCTIVIDAD / 100) * porcentajePosicion);

    const linea = document.createElement('div');
    linea.style.position = 'absolute';
    linea.style.left = '0';
    linea.style.right = '0';
    linea.style.bottom = `${porcentajePosicion}%`;
    linea.style.borderTop = '1px solid #e5e5e5';
    areaGrafico.appendChild(linea);

    const etiquetaEje = document.createElement('div');
    etiquetaEje.textContent = valorLinea;
    etiquetaEje.style.position = 'absolute';
    etiquetaEje.style.left = '-38px';
    etiquetaEje.style.bottom = `calc(${porcentajePosicion}% - 6px)`;
    etiquetaEje.style.fontSize = '10px';
    etiquetaEje.style.color = '#888888';
    etiquetaEje.style.width = '32px';
    etiquetaEje.style.textAlign = 'right';
    areaGrafico.appendChild(etiquetaEje);
  }

  const ultimos = historial.slice(-8);

  const contenedorBarras = document.createElement('div');
  contenedorBarras.style.position = 'relative';
  contenedorBarras.style.width = '100%';
  contenedorBarras.style.height = '100%';
  contenedorBarras.style.display = 'flex';
  contenedorBarras.style.alignItems = 'flex-end';
  contenedorBarras.style.justifyContent = 'space-between';
  contenedorBarras.style.zIndex = '2';
  areaGrafico.appendChild(contenedorBarras);

  const filaHoras = document.createElement('div');
  filaHoras.style.display = 'flex';
  filaHoras.style.justifyContent = 'space-between';
  filaHoras.style.marginLeft = '36px';
  filaHoras.style.marginTop = '6px';
  contenedor.appendChild(filaHoras);

  ultimos.forEach((medicion, indice) => {
    const valor = medicion.conductividad || 0;
    const esUltima = indice === ultimos.length - 1;

    const columna = document.createElement('div');
    columna.style.display = 'flex';
    columna.style.flexDirection = 'column';
    columna.style.alignItems = 'center';
    columna.style.justifyContent = 'flex-end';
    columna.style.height = '100%';
    columna.style.flex = '1';

    const barra = document.createElement('div');
    const alturaPorcentaje = Math.min(Math.max((valor / ESCALA_CONDUCTIVIDAD) * 100, 2), 100);
    barra.title = `${valor} µS/cm — ${formatearHoraArgentina(medicion.timestamp)}`;
    barra.style.height = `${alturaPorcentaje}%`;
    barra.style.width = '60%';
    barra.style.maxWidth = '24px';
    barra.style.backgroundColor = '#2D6A4F';
    barra.style.borderRadius = '12px 12px 0 0';

    columna.appendChild(barra);
    contenedorBarras.appendChild(columna);

    const etiquetaHora = document.createElement('div');
    etiquetaHora.textContent = esUltima ? 'AHORA' : formatearHoraCorta(medicion.timestamp);
    etiquetaHora.style.flex = '1';
    etiquetaHora.style.textAlign = 'center';
    etiquetaHora.style.fontSize = '9px';
    etiquetaHora.style.fontWeight = esUltima ? 'bold' : 'normal';
    etiquetaHora.style.color = esUltima ? '#2D6A4F' : '#666666';
    filaHoras.appendChild(etiquetaHora);
  });
}

cargarConductividad();
setInterval(cargarConductividad, 30 * 1000);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    cargarConductividad();
  }
});