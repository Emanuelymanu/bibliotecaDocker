import multer from 'multer';
import path from 'path';
import crypto from 'crypto';

const storage = multer.diskStorage({
    destination: (req, file, cb) =>{
        cb(null, path.resolve(__dirname, '..','..' ,'upload', 'capa'));
    },

    filename: (req, file, cb)=>{
        const hash = crypto.randomBytes(6).toString('hex');
        const fileName = `${hash}-${file.originalname}`;
        cb(null, fileName);
    }
});

export const upload = multer({storage});