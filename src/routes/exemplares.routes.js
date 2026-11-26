import { Router } from 'express';
import * as controller from '../controllers/exemplares.controller.js';

const router = Router();
router.get('/', controller.listar);
router.get('/:id', controller.buscar);
router.post('/', controller.criar);
router.put('/:id', controller.atualizar);
router.delete('/:id', controller.remover);

export default router;
