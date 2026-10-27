const UMBRAL_TEMPERATURA = { bajo: 15, alto: 32 };
const ESCALA_TEMPERATURA = 40;

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

function calcularEstadoTemperatura(valor) {
  if (valor < UMBRAL_TEMPERATURA.bajo) return 'Bajo';
  if (valor > UMBRAL_TEMPERATURA.alto) return 'Alto';
  return 'Óptimo';
}

function recomendacionTemperatura(estado) {
  if (estado === 'Bajo') return 'La temperatura es baja para la planta. Te recomendamos moverla a un lugar más cálido o alejada de corrientes de aire frío.';
  if (estado === 'Alto') return 'La temperatura es alta para la planta. Te recomendamos ubicarla en un lugar más fresco o con menos sol directo.';
  return 'La temperatura está en un rango óptimo para la planta.';
}

async function cargarTemperatura() {
  const elValor = document.getElementById('valor-temperatura');
  const elEstado = document.getElementById('estado-temperatura');
  const elRecomendacion = document.getElementById('recomendacion-temperatura');
  const elUltimaLectura = document.getElementById('ultima-lectura-temperatura');

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

    const valor = ultimo.temperaturaBME280;

    if (valor === null) {
      if (elValor) elValor.textContent = 'Sin datos';
      if (elEstado) elEstado.textContent = 'Sin datos';
      if (elRecomendacion) elRecomendacion.textContent = 'El sensor de temperatura todavía no está conectado.';
      return;
    }

    if (elValor) elValor.textContent = valor + '°C';

    const estado = calcularEstadoTemperatura(valor);
    if (elEstado) elEstado.textContent = estado;
    if (elRecomendacion) elRecomendacion.textContent = recomendacionTemperatura(estado);
    if (elUltimaLectura) elUltimaLectura.textContent = 'Última lectura: ' + formatearHoraArgentina(ultimo.timestamp) + ' hs. Arg.';

    const resHistorial = await fetchProtegido('http://localhost:3000/api/sensores');
    if (!resHistorial) return;
    const historial = await resHistorial.json();
    dibujarGrafico(historial);
  } catch (error) {
    console.error('Error cargando datos de temperatura:', error);
    if (elValor) elValor.textContent = '--';
    if (elEstado) elEstado.textContent = 'Error';
    if (elRecomendacion) elRecomendacion.textContent = 'No se pudo conectar con el servidor. Revisá que el backend esté corriendo.';
  }
}

function dibujarGrafico(historial) {
  const contenedor = document.getElementById('grafico-temperatura');
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
    const valorLinea = Math.round((ESCALA_TEMPERATURA / 100) * porcentajePosicion);

    const linea = document.createElement('div');
    linea.style.position = 'absolute';
    linea.style.left = '0';
    linea.style.right = '0';
    linea.style.bottom = `${porcentajePosicion}%`;
    linea.style.borderTop = '1px solid #e5e5e5';
    areaGrafico.appendChild(linea);

    const etiquetaEje = document.createElement('div');
    etiquetaEje.textContent = `${valorLinea}°c`;
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
    const valor = medicion.temperaturaBME280 || 0;
    const esUltima = indice === ultimos.length - 1;

    const columna = document.createElement('div');
    columna.style.display = 'flex';
    columna.style.flexDirection = 'column';
    columna.style.alignItems = 'center';
    columna.style.justifyContent = 'flex-end';
    columna.style.height = '100%';
    columna.style.flex = '1';

    const barra = document.createElement('div');
    const alturaPorcentaje = Math.min(Math.max((valor / ESCALA_TEMPERATURA) * 100, 2), 100);
    barra.title = `${valor}°C — ${formatearHoraArgentina(medicion.timestamp)}`;
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

cargarTemperatura();
setInterval(cargarTemperatura, 30 * 1000);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    cargarTemperatura();
  }
});