function obtenerToken() {
  return localStorage.getItem('token');
}

async function cargarPerfil() {
  const token = obtenerToken();
  if (!token) {
    alert('Tenés que iniciar sesión primero');
    window.location.href = '4.%20iniciar-sesion.html';
    return;
  }

  try {
    const res = await fetch('http://localhost:3000/api/usuarios/perfil', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const datos = await res.json();

    if (!res.ok) {
      alert(datos.error || 'No se pudo cargar el perfil');
      return;
    }

    document.getElementById('nombre-perfil-valor').textContent = datos.nombre;
    document.getElementById('input-nombre-perfil').value = datos.nombre;
    document.getElementById('input-fecha-perfil').value = datos.fechaNacimiento;
    document.getElementById('input-mail-perfil').value = datos.mail;
  } catch (error) {
    console.error('Error cargando perfil:', error);
    alert('Error de conexión con el servidor');
  }
}

async function guardarPerfil() {
  const token = obtenerToken();
  const nombre = document.getElementById('input-nombre-perfil').value;
  const fechaNacimiento = document.getElementById('input-fecha-perfil').value;
  const mail = document.getElementById('input-mail-perfil').value;

  try {
    const res = await fetch('http://localhost:3000/api/usuarios/perfil', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ nombre, fechaNacimiento, mail }),
    });
    const datos = await res.json();

    if (!res.ok) {
      alert(datos.error || 'No se pudo guardar');
      return;
    }

    document.getElementById('nombre-perfil-valor').textContent = datos.nombre;
    alert('Perfil actualizado');
  } catch (error) {
    console.error('Error guardando perfil:', error);
    alert('Error de conexión con el servidor');
  }
}

document.getElementById('boton-guardar-perfil').textContent = 'Guardar cambios';
document.getElementById('boton-guardar-perfil').addEventListener('click', guardarPerfil);

cargarPerfil();
