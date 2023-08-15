import { Router } from "express";
import multer from 'multer';
import * as SongsCtrl from "../controllers/api/songs";

const router: Router = Router();

const storage = multer.memoryStorage();

const upload = multer({ storage: storage });

// All paths start with /songs

// GET All songs
router.get("/", SongsCtrl.getSongs);
// GET One song
router.get('/:id', SongsCtrl.getSong)
// POST New song
router.post("/add", upload.fields([{name: 'audioFile', maxCount: 1}, {name: 'artwork', maxCount: 1}]), SongsCtrl.addSong);
// PUT Edit song
router.put("/:id", SongsCtrl.updateSong);
// DELETE song
router.delete("/:id", SongsCtrl.deleteSong);

export default router;