import { Router } from "express";
import * as UsersCtrl from '../controllers/api/users';

const router: Router = Router();

// All paths start with /users

// POST new user
router.post('/', UsersCtrl.create);
// POST login existing user
router.post('/login', UsersCtrl.login);

export default router;