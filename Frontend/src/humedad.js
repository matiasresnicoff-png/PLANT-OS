const UMBRAL_HUMEDAD = { bajo: 30, alto: 70 };
const ESCALA_HUMEDAD = 100;

// El backend guarda el timestamp en UTC (hora universal). Esta función lo
// convierte a hora de Argentina (UTC-3) para mostrarlo en pantalla.
function formatearHoraArgentina(timestampUTC) {
  return new Date(timestampUTC).toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Versión corta, solo "HH:MM", para las etiquetas debajo de cada barra del gráfico.
function formatearHoraCorta(timestampUTC) {
  return new Date(timestampUTC).toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function calcularEstadoHumedad(valor) {
  if (valor < UMBRAL_HUMEDAD.bajo) return 'Bajo';
  if (valor > UMBRAL_HUMEDAD.alto) return 'Alto';
  return 'Óptimo';
}

function recomendacionHumedad(estado) {
  if (estado === 'Bajo') return 'La tierra está seca. Te recomendamos regar la planta pronto.';
  if (estado === 'Alto') return 'Hay exceso de agua en la tierra. Evitá regar hasta que baje la humedad.';
  return 'La humedad del suelo está en un rango óptimo. No hace falta regar todavía.';
}

async function cargarHumedad() {
  document.getElementById('valor-humedad').textContent = 'Cargando...';
  document.getElementById('recomendacion-humedad').textContent = '';

  try {
    const resUltimo = await fetchProtegido('http://localhost:3000/api/sensores/ultimo');
    if (!resUltimo) return;
    const ultimo = await resUltimo.json();

    if (!resUltimo.ok) {
      document.getElementById('valor-humedad').textContent = '--';
      document.getElementById('estado-humedad').textContent = 'Error';
      document.getElementById('recomendacion-humedad').textContent = ultimo.error || 'No se pudo obtener los datos.';
      return;
    }

    if (ultimo.mensaje) {
      document.getElementById('valor-humedad').textContent = '--';
      document.getElementById('estado-humedad').textContent = 'Sin datos';
      document.getElementById('recomendacion-humedad').textContent = 'Todavía no hay mediciones. Esperá a que el sensor mande datos.';
      return;
    }

    const valor = ultimo.humedadSuelo;
    document.getElementById('valor-humedad').textContent = valor + '%';

    const estado = calcularEstadoHumedad(valor);
    document.getElementById('estado-humedad').textContent = estado;
    document.getElementById('recomendacion-humedad').textContent =
      recomendacionHumedad(estado) + ' (Última lectura: ' + formatearHoraArgentina(ultimo.timestamp) + ' hs. Arg.)';

    const resHistorial = await fetchProtegido('http://localhost:3000/api/sensores');
    if (!resHistorial) return;
    const historial = await resHistorial.json();
    dibujarGrafico(historial);
  } catch (error) {
    console.error('Error cargando datos de humedad:', error);
    document.getElementById('valor-humedad').textContent = '--';
    document.getElementById('estado-humedad').textContent = 'Error';
    document.getElementById('recomendacion-humedad').textContent = 'No se pudo conectar con el servidor. Revisá que el backend esté corriendo.';
  }
}

function dibujarGrafico(historial) {
  const contenedor = document.getElementById('grafico-humedad');
  contenedor.innerHTML = '';
  contenedor.style.display = 'flex';
  contenedor.style.flexDirection = 'column';
  contenedor.style.boxSizing = 'border-box';
  contenedor.style.padding = '10px 10px 6px';
  contenedor.style.fontFamily = 'Arial, sans-serif';

  // Área de las barras + líneas de referencia del eje Y (como en el Figma).
  const areaGrafico = document.createElement('div');
  areaGrafico.style.position = 'relative';
  areaGrafico.style.flex = '1';
  areaGrafico.style.display = 'flex';
  areaGrafico.style.alignItems = 'flex-end';
  areaGrafico.style.gap = '4%';
  areaGrafico.style.marginLeft = '24px';
  areaGrafico.style.borderBottom = '1px solid #e2e2e2';
  contenedor.appendChild(areaGrafico);

  // Eje Y: 5 líneas horizontales parejas, con su valor a la izquierda.
  const pasoEjeY = ESCALA_HUMEDAD / 5;
  for (let i = 1; i <= 5; i = i + 1) {
    const valorLinea = pasoEjeY * i;
    const posicion = (valorLinea / ESCALA_HUMEDAD) * 100;

    const linea = document.createElement('div');
    linea.style.position = 'absolute';
    linea.style.left = '0';
    linea.style.right = '0';
    linea.style.bottom = posicion + '%';
    linea.style.borderTop = '1px dashed #e2e2e2';
    areaGrafico.appendChild(linea);

    const etiquetaEje = document.createElement('div');
    etiquetaEje.textContent = Math.round(valorLinea) + '%';
    etiquetaEje.style.position = 'absolute';
    etiquetaEje.style.left = '-24px';
    etiquetaEje.style.bottom = `calc(${posicion}% - 5px)`;
    etiquetaEje.style.fontSize = '8px';
    etiquetaEje.style.color = '#8a8a8a';
    areaGrafico.appendChild(etiquetaEje);
  }

  const ultimos = historial.slice(-7);

  // Fila de horarios debajo de cada barra (la última dice "AHORA").
  const filaHoras = document.createElement('div');
  filaHoras.style.display = 'flex';
  filaHoras.style.gap = '4%';
  filaHoras.style.marginLeft = '24px';
  filaHoras.style.marginTop = '4px';
  contenedor.appendChild(filaHoras);

  ultimos.forEach((medicion, indice) => {
    const valor = medicion.humedadSuelo;
    const estadoBarra = calcularEstadoHumedad(valor);

    const columna = document.createElement('div');
    columna.style.display = 'flex';
    columna.style.flexDirection = 'column';
    columna.style.alignItems = 'center';
    columna.style.justifyContent = 'flex-end';
    columna.style.height = '100%';
    columna.style.flex = '1';
    columna.style.zIndex = '3';

    const etiqueta = document.createElement('div');
    etiqueta.textContent = valor + '%';
    etiqueta.style.fontSize = '10px';
    etiqueta.style.fontWeight = 'bold';
    etiqueta.style.marginBottom = '3px';
    etiqueta.style.color = '#2D6A4F';

    const barra = document.createElement('div');
    const alturaPorcentaje = (valor / ESCALA_HUMEDAD) * 100;
    barra.title = `${valor}% — ${estadoBarra} — ${formatearHoraArgentina(medicion.timestamp)} hs. Arg.`;
    barra.style.height = alturaPorcentaje + '%';
    barra.style.width = '65%';
    barra.style.minHeight = '5px';
    barra.style.borderRadius = '6px 6px 2px 2px';
    barra.style.transition = 'transform 0.15s ease';
    barra.style.background = estadoBarra === 'Óptimo'
      ? 'linear-gradient(180deg, #6fd07f, #2D6A4F)'
      : 'linear-gradient(180deg, #ffb15c, #e07a1f)';

    barra.addEventListener('mouseenter', () => { barra.style.transform = 'scaleY(1.03)'; });
    barra.addEventListener('mouseleave', () => { barra.style.transform = 'scaleY(1)'; });

    columna.appendChild(etiqueta);
    columna.appendChild(barra);
    areaGrafico.appendChild(columna);

    const esUltima = indice === ultimos.length - 1;
    const etiquetaHora = document.createElement('div');
    etiquetaHora.textContent = esUltima ? 'AHORA' : formatearHoraCorta(medicion.timestamp);
    etiquetaHora.style.flex = '1';
    etiquetaHora.style.textAlign = 'center';
    etiquetaHora.style.fontSize = '8px';
    etiquetaHora.style.fontWeight = esUltima ? 'bold' : 'normal';
    etiquetaHora.style.color = esUltima ? '#2D6A4F' : '#8a8a8a';
    filaHoras.appendChild(etiquetaHora);
  });
}

cargarHumedad();
setInterval(cargarHumedad, 15 * 60 * 1000);