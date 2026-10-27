const UMBRAL_TEMPERATURA = { bajo: 15, alto: 32 };
const ESCALA_TEMPERATURA = 40;

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
  document.getElementById('valor-temperatura').textContent = 'Cargando...';
  document.getElementById('recomendacion-temperatura').innerHTML = '';

  try {
    const resUltimo = await fetchProtegido('http://localhost:3000/api/sensores/ultimo');
    if (!resUltimo) return;
    const ultimo = await resUltimo.json();

    if (!resUltimo.ok) {
      document.getElementById('valor-temperatura').textContent = '--';
      document.getElementById('estado-temperatura').textContent = 'Error';
      document.getElementById('recomendacion-temperatura').innerHTML = '<strong>Recomendación:</strong> ' + (ultimo.error || 'No se pudo obtener los datos.');
      return;
    }

    if (ultimo.mensaje) {
      document.getElementById('valor-temperatura').textContent = '--';
      document.getElementById('estado-temperatura').textContent = 'Sin datos';
      document.getElementById('recomendacion-temperatura').innerHTML = '<strong>Recomendación:</strong> Todavía no hay mediciones. Esperá a que el sensor mande datos.';
      return;
    }

    const valor = ultimo.temperaturaBME280;

    if (valor === null) {
      document.getElementById('valor-temperatura').textContent = 'Sin datos';
      document.getElementById('estado-temperatura').textContent = 'Sin datos';
      document.getElementById('recomendacion-temperatura').innerHTML = '<strong>Recomendación:</strong> El sensor de temperatura todavía no está conectado.';
      return;
    }

    document.getElementById('valor-temperatura').textContent = valor + '°C';

    const estado = calcularEstadoTemperatura(valor);
    document.getElementById('estado-temperatura').textContent = estado;
    document.getElementById('recomendacion-temperatura').innerHTML = '<strong>Recomendación:</strong> ' + recomendacionTemperatura(estado);

    const resHistorial = await fetchProtegido('http://localhost:3000/api/sensores');
    if (!resHistorial) return;
    const historial = await resHistorial.json();
    dibujarGraficoTemperatura(historial);
  } catch (error) {
    console.error('Error cargando datos de temperatura:', error);
    document.getElementById('valor-temperatura').textContent = '--';
    document.getElementById('estado-temperatura').textContent = 'Error';
    document.getElementById('recomendacion-temperatura').innerHTML = '<strong>Recomendación:</strong> No se pudo conectar con el servidor. Revisá que el backend esté corriendo.';
  }
}

function dibujarGraficoTemperatura(historial) {
  const contenedor = document.getElementById('grafico-temperatura');
  contenedor.innerHTML = '';
  
  contenedor.style.position = 'relative';
  contenedor.style.display = 'flex';
  contenedor.style.alignItems = 'flex-end';
  contenedor.style.justifyContent = 'space-between';
  contenedor.style.width = '100%';
  contenedor.style.height = '175px';
  contenedor.style.padding = '12px 20px 24px 45px'; 
  contenedor.style.boxSizing = 'border-box';
  contenedor.style.fontFamily = 'Arial, sans-serif';

  [0, 25, 50, 75, 100].forEach((porcentaje) => {
    const linea = document.createElement('div');
    linea.style.position = 'absolute';
    linea.style.left = '45px';
    linea.style.right = '20px';
    linea.style.bottom = `calc(${porcentaje}% + 24px)`;
    linea.style.borderTop = porcentaje === 0 ? '1px solid rgba(0,0,0,0.3)' : '1px dashed rgba(0, 0, 0, 0.15)';
    linea.style.zIndex = '1';
    contenedor.appendChild(linea);

    const etiquetaEje = document.createElement('div');
    const valorEje = Math.round((porcentaje / 100) * ESCALA_TEMPERATURA);
    etiquetaEje.textContent = valorEje + '°';
    etiquetaEje.style.position = 'absolute';
    etiquetaEje.style.left = '6px';
    etiquetaEje.style.bottom = `calc(${porcentaje}% + 17px)`;
    etiquetaEje.style.fontSize = '9px';
    etiquetaEje.style.color = '#555';
    etiquetaEje.style.fontWeight = '600';
    etiquetaEje.style.zIndex = '2';
    contenedor.appendChild(etiquetaEje);
  });

  const ultimos = historial.slice(-9);
  const horariosFijos = ['0:00', '3:00', '6:00', '9:00', '12:00', '15:00', '18:00', '21:00', 'AHORA'];

  ultimos.forEach((medicion, index) => {
    const valor = medicion.temperaturaBME280;
    const estadoBarra = calcularEstadoTemperatura(valor);

    const columna = document.createElement('div');
    columna.style.display = 'flex';
    columna.style.flexDirection = 'column';
    columna.style.alignItems = 'center';
    columna.style.justifyContent = 'flex-end';
    columna.style.height = '100%';
    columna.style.flex = '1';
    columna.style.zIndex = '3';
    columna.style.position = 'relative';

    const barra = document.createElement('div');
    const alturaPorcentaje = Math.max((valor / ESCALA_TEMPERATURA) * 100, 8);
    barra.title = `${valor}°C — ${estadoBarra}`;
    barra.style.height = alturaPorcentaje + '%';
    barra.style.width = '70%';
    barra.style.minHeight = '8px';
    barra.style.borderRadius = '6px 6px 0 0';
    barra.style.boxShadow = '0 3px 6px rgba(0,0,0,0.12)';
    barra.style.transition = 'transform 0.15s ease';

    barra.style.background = estadoBarra === 'Óptimo'
      ? 'linear-gradient(180deg, #3b7a42, #244b29)'
      : 'linear-gradient(180deg, #f59e0b, #d97706)';

    barra.addEventListener('mouseenter', () => { barra.style.transform = 'scaleY(1.03)'; });
    barra.addEventListener('mouseleave', () => { barra.style.transform = 'scaleY(1)'; });

    const etiquetaHora = document.createElement('div');
    if (index === ultimos.length - 1) {
      etiquetaHora.textContent = 'AHORA';
    } else if (index < horariosFijos.length) {
      etiquetaHora.textContent = horariosFijos[index];
    }

    etiquetaHora.style.position = 'absolute';
    etiquetaHora.style.bottom = '-18px';
    etiquetaHora.style.fontSize = '9px';
    etiquetaHora.style.color = '#555';
    etiquetaHora.style.fontWeight = '700';
    etiquetaHora.style.whiteSpace = 'nowrap';

    columna.appendChild(barra);
    columna.appendChild(etiquetaHora);
    contenedor.appendChild(columna);
  });
}

cargarTemperatura();
setInterval(cargarTemperatura, 15 * 60 * 1000);