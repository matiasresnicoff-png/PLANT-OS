async function cargarNombreUsuario() {
  try {
    const res = await fetchProtegido('http://localhost:3000/api/usuarios/perfil');
    if (!res) return;
    const datos = await res.json();

    if (!res.ok) {
      return;
    }

    document.getElementById('nombre-usuario-inicio').textContent = datos.nombre;
  } catch (error) {
    console.error('Error cargando el nombre del usuario:', error);
  }
}

function cerrarSesion() {
  localStorage.removeItem('token');
  window.location.href = '4. iniciar-sesion.html';
}

cargarNombreUsuario();
