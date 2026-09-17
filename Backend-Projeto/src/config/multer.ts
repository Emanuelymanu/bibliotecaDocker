import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';

const uploadDir = path.resolve(__dirname, '..', '..', 'upload', 'capa');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const extensoesPermitidas = /\.(jpe?g|png|gif|webp)$/i;
const mimesPermitidos = /^image\/(jpeg|png|gif|webp)$/i;

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },

    filename: (req, file, cb) => {
       
        const hash = crypto.randomBytes(16).toString('hex');
        const extensao = path.extname(file.originalname).toLowerCase();
        cb(null, `${hash}${extensao}`);
    }
});

const fileFilter: multer.Options['fileFilter'] = (req, file, cb) => {
    const extensaoValida = extensoesPermitidas.test(path.extname(file.originalname));
    const mimeValido = mimesPermitidos.test(file.mimetype);

    if (extensaoValida && mimeValido) {
        cb(null, true);
    } else {
        cb(new Error('Apenas imagens JPEG, PNG, GIF ou WEBP são permitidas'));
    }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } 
});