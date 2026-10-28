const UMBRAL_CONDUCTIVIDAD = { bajo: 200, alto: 2000 };
const ESCALA_CONDUCTIVIDAD = 3000;

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
  document.getElementById('valor-conductividad').textContent = 'Cargando...';
  document.getElementById('recomendacion-conductividad').innerHTML = '';

  try {
    const resUltimo = await fetchProtegido('http://localhost:3000/api/sensores/ultimo');
    if (!resUltimo) return;
    const ultimo = await resUltimo.json();

    if (!resUltimo.ok) {
      document.getElementById('valor-conductividad').textContent = '--';
      document.getElementById('estado-conductividad').textContent = 'Error';
      document.getElementById('recomendacion-conductividad').innerHTML = '<strong>Recomendación:</strong> ' + (ultimo.error || 'No se pudo obtener los datos.');
      return;
    }

    if (ultimo.mensaje) {
      document.getElementById('valor-conductividad').textContent = '--';
      document.getElementById('estado-conductividad').textContent = 'Sin datos';
      document.getElementById('recomendacion-conductividad').innerHTML = '<strong>Recomendación:</strong> Todavía no hay mediciones. Esperá a que el sensor mande datos.';
      return;
    }

    const valor = ultimo.conductividad;

    if (valor === null) {
      document.getElementById('valor-conductividad').textContent = 'Sin datos';
      document.getElementById('estado-conductividad').textContent = 'Sin datos';
      document.getElementById('recomendacion-conductividad').innerHTML = '<strong>Recomendación:</strong> El sensor de conductividad todavía no está conectado.';
      return;
    }

    document.getElementById('valor-conductividad').textContent = valor + ' µS/cm';

    const estado = calcularEstadoConductividad(valor);
    document.getElementById('estado-conductividad').textContent = estado;
    document.getElementById('recomendacion-conductividad').innerHTML = '<strong>Recomendación:</strong> ' + recomendacionConductividad(estado);

    const resHistorial = await fetchProtegido('http://localhost:3000/api/sensores');
    if (!resHistorial) return;
    const historial = await resHistorial.json();
    dibujarGraficoConductividad(historial);
  } catch (error) {
    console.error('Error cargando datos de conductividad:', error);
    document.getElementById('valor-conductividad').textContent = '--';
    document.getElementById('estado-conductividad').textContent = 'Error';
    document.getElementById('recomendacion-conductividad').innerHTML = '<strong>Recomendación:</strong> No se pudo conectar con el servidor. Revisá que el backend esté corriendo.';
  }
}

function dibujarGraficoConductividad(historial) {
  const contenedor = document.getElementById('grafico-conductividad');
  contenedor.innerHTML = '';
  
  contenedor.style.position = 'relative';
  contenedor.style.display = 'flex';
  contenedor.style.alignItems = 'flex-end';
  contenedor.style.justifyContent = 'space-between';
  contenedor.style.width = '100%';
  contenedor.style.height = '175px';
  contenedor.style.padding = '12px 20px 24px 50px'; 
  contenedor.style.boxSizing = 'border-box';
  contenedor.style.fontFamily = 'Arial, sans-serif';

  [0, 25, 50, 75, 100].forEach((porcentaje) => {
    const linea = document.createElement('div');
    linea.style.position = 'absolute';
    linea.style.left = '50px';
    linea.style.right = '20px';
    linea.style.bottom = `calc(${porcentaje}% + 24px)`;
    linea.style.borderTop = porcentaje === 0 ? '1px solid rgba(0,0,0,0.3)' : '1px dashed rgba(0, 0, 0, 0.15)';
    linea.style.zIndex = '1';
    contenedor.appendChild(linea);

    const etiquetaEje = document.createElement('div');
    const valorEje = Math.round((porcentaje / 100) * ESCALA_CONDUCTIVIDAD);
    etiquetaEje.textContent = valorEje;
    etiquetaEje.style.position = 'absolute';
    etiquetaEje.style.left = '8px';
    etiquetaEje.style.bottom = `calc(${porcentaje}% + 17px)`;
    etiquetaEje.style.fontSize = '9px';
    etiquetaEje.style.color = '#555';
    etiquetaEje.style.fontWeight = '600';
    etiquetaEje.style.zIndex = '2';
    contenedor.appendChild(etiquetaEje);
  });

  const ultimos = historial.slice(-9);

  ultimos.forEach((medicion, index) => {
    const valor = medicion.conductividad;
    const estadoBarra = calcularEstadoConductividad(valor);

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
    
    // Altura proporcional basada en Figma (Máximo 7.6875rem)
    const proporcion = Math.min(Math.max(valor / ESCALA_CONDUCTIVIDAD, 0.05), 1);
    const alturaRem = proporcion * 7.6875;

    barra.title = `${valor} µS/cm — ${estadoBarra}`;
    barra.style.height = `${alturaRem}rem`;
    
    // Características de Figma
    barra.style.width = '1.5625rem';
    barra.style.borderRadius = '0.8125rem';
    
    barra.style.boxShadow = '0 3px 6px rgba(0,0,0,0.12)';
    barra.style.transition = 'transform 0.15s ease';

    barra.style.background = estadoBarra === 'Óptimo'
      ? 'linear-gradient(180deg, #3b7a42, #244b29)'
      : 'linear-gradient(180deg, #f59e0b, #d97706)';

    barra.addEventListener('mouseenter', () => { barra.style.transform = 'scaleY(1.03)'; });
    barra.addEventListener('mouseleave', () => { barra.style.transform = 'scaleY(1)'; });

    const etiquetaHora = document.createElement('div');
    
    if (medicion.fecha || medicion.createdAt) {
      const fechaObj = new Date(medicion.fecha || medicion.createdAt);
      etiquetaHora.textContent = new Intl.DateTimeFormat('es-AR', {
        timeZone: 'America/Argentina/Buenos_Aires',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(fechaObj);
    } else {
      etiquetaHora.textContent = index === ultimos.length - 1 ? 'AHORA' : '--:--';
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

cargarConductividad();
setInterval(cargarConductividad, 15 * 60 * 1000);