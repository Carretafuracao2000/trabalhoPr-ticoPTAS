import { Router } from 'express';
import * as controller from '../controllers/leitores.controller.js';

const router = Router();
router.get('/', controller.listar);
router.get('/:id', controller.buscar);
router.get('/:id/situacao', controller.situacao);
router.post('/', controller.criar);
router.put('/:id', controller.atualizar);
router.delete('/:id', controller.remover);

export default router;
