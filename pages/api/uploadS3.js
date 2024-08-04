import { S3Client } from '@aws-sdk/client-s3';
import multer from 'multer';
import multerS3 from 'multer-s3';

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const projectFolder = req.query.projectFolder || 'default';
    console.log('Backend - Project Folder:', projectFolder);

    const upload = multer({
      storage: multerS3({
        s3: s3,
        bucket: process.env.S3_BUCKET_NAME,
        metadata: function (req, file, cb) {
          cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
          cb(null, `${projectFolder}/imagenes/${Date.now()}-${file.originalname}`);
        },
      }),
    });

    const uploadMiddleware = upload.single('file');

    try {
      await new Promise((resolve, reject) => {
        uploadMiddleware(req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      if (!req.file) {
        throw new Error('No file uploaded');
      }

      console.log('Backend - File uploaded successfully');
      console.log('Backend - File location:', req.file.location);
      res.status(200).json({ url: req.file.location });
    } catch (error) {
      console.error('Backend - Error uploading to S3:', error);
      res.status(500).json({ error: 'Error uploading to S3', details: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}