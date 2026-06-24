import { Router } from 'express';
import * as userController from './user.controller';
import { requireAuth } from '../../middleware/requireAuth';
import { validate } from '../../middleware/validate';
import { updateProfileSchema, deleteAccountSchema } from './user.schema';

const router = Router();

// All routes here require authentication
router.use(requireAuth);

router.get('/me', userController.getMe);
router.patch('/me', validate({ body: updateProfileSchema }), userController.updateMe);
router.delete('/me', validate({ body: deleteAccountSchema }), userController.deleteMe);
router.get('/me/export', userController.exportMe);

export default router;
