import { Router } from 'express';
import { registrarUsuario, loginUsuario, verPerfil, editarPerfil } from '../controladores/usuariosControlador.ts';
import { verificarToken } from '../middlewares/verificarToken.ts';

const router = Router();

router.post('/usuarios', registrarUsuario);
router.post('/login', loginUsuario);
router.get('/usuarios/perfil', verificarToken, verPerfil);
router.put('/usuarios/perfil', verificarToken, editarPerfil);

export default router;