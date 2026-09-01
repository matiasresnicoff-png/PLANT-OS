<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Detalle temperaatura - plantOS</title>
    <link rel="stylesheet" href="PlantOS.css">
</head>
<body>
    <main class="wireframe">
        <section class="detalle-humedad">
            <header class="header-superior">
             <section class="icono-registro"></section>
             <section class="LOGO"></section>
            </header>
            <section class="titulo-humedad"></section>
            <section class="tarjeta-estado">
                <section class="dato-estado" id="estado-temperatura"></section>
                <section class="valor-estado" id="valor-temperatura"></section>
                <section class="subtitulo-humedad"></section>
            </section>
            <section class="subtitulo-humedad"></section>
            <section class="grafico-humedad">
                <section class="grafico-interior" id="grafico-temperatura"></section>
            </section>
            <section class="tarjeta-informacion">
                <section class="informacion-interior" id="recomendacion-temperatura"></section>
            </section>
            <section class="barra-navegacion">
                <section class="icono-navegacion"></section>
                <section class="opcion-izquierda"></section>
                <section class="opcion-centro"></section>
                <section class="opcion-derecha"></section>
            </section>
        </section>
    </main>

    <script src="src/temperatura.js" defer></script>
</body>
</html>