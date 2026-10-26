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

// Función auxiliar para extraer y formatear la hora real (HH:mm)
function formatearHora(fechaString) {
  if (!fechaString) return '--:--';
  const fecha = new Date(fechaString);
  if (isNaN(fecha.getTime())) return '--:--';
  
  const horas = fecha.getHours().toString().padStart(2, '0');
  const minutos = fecha.getMinutes().toString().padStart(2, '0');
  return `${horas}:${minutos}`;
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
  contenedor.style.position = 'relative';
  contenedor.style.display = 'flex';
  contenedor.style.alignItems = 'flex-end';
<<<<<<< HEAD
  contenedor.style.gap = '4%';
  contenedor.style.borderBottom = '2px solid rgba(255,255,255,0.6)';
  contenedor.style.padding = '28px 6px 0';
  contenedor.style.boxSizing = 'border-box';
  contenedor.style.fontFamily = 'Arial, sans-serif';

  [
    { valor: UMBRAL_HUMEDAD.bajo, texto: `Bajo ${UMBRAL_HUMEDAD.bajo}%` },
    { valor: UMBRAL_HUMEDAD.alto, texto: `Alto ${UMBRAL_HUMEDAD.alto}%` },
  ].forEach(({ valor, texto }) => {
    const posicion = (valor / ESCALA_HUMEDAD) * 100;

    const linea = document.createElement('div');
    linea.style.position = 'absolute';
    linea.style.left = '0';
    linea.style.right = '0';
    linea.style.bottom = posicion + '%';
    linea.style.borderTop = '1px dashed rgba(255,255,255,0.7)';
    contenedor.appendChild(linea);

    const etiquetaLinea = document.createElement('div');
    etiquetaLinea.textContent = texto;
    etiquetaLinea.style.position = 'absolute';
    etiquetaLinea.style.left = '4px';
    etiquetaLinea.style.bottom = `calc(${posicion}% + 3px)`;
    etiquetaLinea.style.fontSize = '9px';
    etiquetaLinea.style.fontWeight = '600';
    etiquetaLinea.style.color = '#fff';
    etiquetaLinea.style.background = 'rgba(0,0,0,0.45)';
    etiquetaLinea.style.padding = '1px 5px';
    etiquetaLinea.style.borderRadius = '8px';
    etiquetaLinea.style.zIndex = '5';
    contenedor.appendChild(etiquetaLinea);
  });

  const ultimos = historial.slice(-8);
=======
  contenedor.style.justifyContent = 'space-between';
  contenedor.style.width = '100%';
  contenedor.style.height = '175px';
  contenedor.style.padding = '12px 20px 28px 45px'; 
  contenedor.style.boxSizing = 'border-box';
  contenedor.style.fontFamily = 'Arial, sans-serif';

  const ALTURA_UTIL = 135; 
  [0, 25, 50, 75, 100].forEach((porcentaje) => {
    const bottomPx = 28 + (porcentaje / 100) * ALTURA_UTIL;

    const linea = document.createElement('div');
    linea.style.position = 'absolute';
    linea.style.left = '45px';
    linea.style.right = '20px';
    linea.style.bottom = `${bottomPx}px`;
    linea.style.borderTop = porcentaje === 0 ? '1px solid rgba(0,0,0,0.3)' : '1px dashed rgba(0, 0, 0, 0.15)';
    linea.style.zIndex = '1';
    contenedor.appendChild(linea);

    const etiquetaEje = document.createElement('div');
    etiquetaEje.textContent = porcentaje + '%';
    etiquetaEje.style.position = 'absolute';
    etiquetaEje.style.left = '6px';
    etiquetaEje.style.bottom = `${bottomPx - 6}px`;
    etiquetaEje.style.fontSize = '9px';
    etiquetaEje.style.color = '#555';
    etiquetaEje.style.fontWeight = '600';
    etiquetaEje.style.zIndex = '2';
    contenedor.appendChild(etiquetaEje);
  });

  const ultimos = historial.slice(-9);
>>>>>>> 7aa25d27a223ea78e1084240c9d14907963cd529

  ultimos.forEach((medicion) => {
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
    etiqueta.style.fontSize = '11px';
    etiqueta.style.fontWeight = 'bold';
    etiqueta.style.marginBottom = '4px';
    etiqueta.style.color = '#fff';
    etiqueta.style.textShadow = '0 1px 2px rgba(0,0,0,0.5)';

    const barra = document.createElement('div');
<<<<<<< HEAD
    const alturaPorcentaje = (valor / ESCALA_HUMEDAD) * 100;
    barra.title = `${valor}% — ${estadoBarra} — ${formatearHoraArgentina(medicion.timestamp)} hs. Arg.`;
    barra.style.height = alturaPorcentaje + '%';
    barra.style.width = '70%';
    barra.style.minHeight = '6px';
    barra.style.borderRadius = '6px 6px 2px 2px';
    barra.style.boxShadow = '0 2px 4px rgba(0,0,0,0.25)';
=======
    const alturaPorcentaje = Math.max((valor / ESCALA_HUMEDAD) * 100, 5);
    
    // Obtiene la hora real de la medición (ajustá la propiedad si en tu base de datos se llama distinto)
    const fechaOrigen = medicion.fecha || medicion.created_at || medicion.timestamp || medicion.createdAt;
    const horaTexto = formatearHora(fechaOrigen);

    barra.title = `Hora: ${horaTexto} | Humedad: ${valor}% — ${estadoBarra}`;
    barra.style.height = `calc(${alturaPorcentaje}% - 28px)`;
    barra.style.width = '70%';
    barra.style.minHeight = '6px';
    barra.style.borderRadius = '6px 6px 0 0';
    barra.style.boxShadow = '0 3px 6px rgba(0,0,0,0.12)';
>>>>>>> 7aa25d27a223ea78e1084240c9d14907963cd529
    barra.style.transition = 'transform 0.15s ease';
    barra.style.background = estadoBarra === 'Óptimo'
      ? 'linear-gradient(180deg, #6fd07f, #2f8f45)'
      : 'linear-gradient(180deg, #ffb15c, #e07a1f)';

    barra.addEventListener('mouseenter', () => { barra.style.transform = 'scaleY(1.03)'; });
    barra.addEventListener('mouseleave', () => { barra.style.transform = 'scaleY(1)'; });

<<<<<<< HEAD
    columna.appendChild(etiqueta);
=======
    const etiquetaHora = document.createElement('div');
    
    if (index === ultimos.length - 1) {
      etiquetaHora.textContent = 'AHORA';
    } else {
      etiquetaHora.textContent = horaTexto;
    }

    etiquetaHora.style.position = 'absolute';
    etiquetaHora.style.bottom = '-20px';
    etiquetaHora.style.fontSize = '9px';
    etiquetaHora.style.color = '#555';
    etiquetaHora.style.fontWeight = '700';
    etiquetaHora.style.whiteSpace = 'nowrap';

>>>>>>> 7aa25d27a223ea78e1084240c9d14907963cd529
    columna.appendChild(barra);
    contenedor.appendChild(columna);
  });
}

cargarHumedad();
setInterval(cargarHumedad, 15 * 60 * 1000);