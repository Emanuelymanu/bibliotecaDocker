import { Router } from 'express';
import { DashboardController } from '../controller/DashboardController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();
const dashboardController = new DashboardController();


router.use(authMiddleware);


router.get('/', (req, res) => dashboardController.obterDashboard(req, res));



export default router;