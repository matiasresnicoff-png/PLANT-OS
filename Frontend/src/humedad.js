function dibujarGrafico(historial) {
  const contenedor = document.getElementById('grafico-humedad');
  contenedor.innerHTML = '';
  contenedor.style.position = 'relative';
  contenedor.style.display = 'flex';
  contenedor.style.alignItems = 'flex-end';
  contenedor.style.justifyContent = 'space-between';
  contenedor.style.borderBottom = '2px solid #444';
  contenedor.style.paddingTop = '20px';
  contenedor.style.boxSizing = 'border-box';

  // Líneas de referencia de los umbrales (bajo / alto)
  [UMBRAL_HUMEDAD.bajo, UMBRAL_HUMEDAD.alto].forEach((umbral) => {
    const linea = document.createElement('div');
    const posicion = (umbral / ESCALA_HUMEDAD) * 100;
    linea.style.position = 'absolute';
    linea.style.left = '0';
    linea.style.right = '0';
    linea.style.bottom = posicion + '%';
    linea.style.borderTop = '1px dashed #999';
    linea.style.fontSize = '9px';
    linea.style.color = '#777';
    linea.style.paddingLeft = '2px';
    linea.textContent = umbral + '%';
    contenedor.appendChild(linea);
  });

  const ultimos = historial.slice(-8);

  ultimos.forEach((medicion) => {
    const valor = medicion.humedadSuelo;
    const estadoBarra = calcularEstadoHumedad(valor);

    const columna = document.createElement('div');
    columna.style.display = 'flex';
    columna.style.flexDirection = 'column';
    columna.style.alignItems = 'center';
    columna.style.width = '10%';

    const etiqueta = document.createElement('div');
    etiqueta.textContent = valor + '%';
    etiqueta.style.fontSize = '10px';
    etiqueta.style.marginBottom = '2px';
    etiqueta.style.color = '#333';

    const barra = document.createElement('div');
    const alturaPorcentaje = (valor / ESCALA_HUMEDAD) * 100;
    barra.style.height = alturaPorcentaje + '%';
    barra.style.width = '100%';
    barra.style.minHeight = '4px';
    barra.style.background = estadoBarra === 'Óptimo' ? '#3a7d44' : '#c9762b';

    columna.appendChild(etiqueta);
    columna.appendChild(barra);
    contenedor.appendChild(columna);
  });
}