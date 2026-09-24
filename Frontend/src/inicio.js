function obtenerToken() {
  return localStorage.getItem('token');
}

async function cargarNombreUsuario() {
  const token = obtenerToken();

  if (!token) {
    mostrarToast('Tenés que iniciar sesión primero', true);
    setTimeout(() => { window.location.href = '4. iniciar-sesion.html'; }, 1200);
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

function cerrarSesion() {
  localStorage.removeItem('token');
  window.location.href = '4. iniciar-sesion.html';
}

cargarNombreUsuario();
