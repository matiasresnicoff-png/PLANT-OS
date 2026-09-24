function obtenerToken() {
  return localStorage.getItem('token');
}

async function cargarNombreUsuario() {
  const token = obtenerToken();

  if (!token) {
    alert('Tenés que iniciar sesión primero');
    window.location.href = '4. iniciar-sesion.html';
    return;
  }

  try {
    const res = await fetch('http://localhost:3000/api/usuarios/perfil', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const datos = await res.json();

    if (!res.ok) {
      return;
    }

    document.getElementById('nombre-usuario-inicio').textContent = datos.nombre;
  } catch (error) {
    console.error('Error cargando el nombre del usuario:', error);
  }
}

cargarNombreUsuario();
