// pages/api/uploadS3.js
import { S3Client } from '@aws-sdk/client-s3';
import multer from 'multer';
import multerS3 from 'multer-s3';
import slugify from 'slugify';

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

const ALLOWED_DOCUMENT_TYPES = {
  'application/pdf': true,
  'application/msword': true,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': true,
  'application/vnd.ms-excel': true,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': true
};

const ALLOWED_IMAGE_TYPES = {
  'image/jpeg': true,
  'image/png': true,
  'image/gif': true
};

const sanitizeFilename = (filename) => {
  const lastDot = filename.lastIndexOf('.');
  const ext = filename.substring(lastDot);
  const nameWithoutExt = filename.substring(0, lastDot);

  const sanitizedName = slugify(nameWithoutExt, { 
    lower: true, 
    strict: true,
    replacement: '-'
  });

  return `${sanitizedName}${ext}`;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} Not Allowed`
    });
  }

  try {
    const { 
      organizationName, 
      organizationId, 
      projectName, 
      projectId, 
      companyName,
      companyId,
      type 
    } = req.query;

    // Verificar la autorización de la organización
    const requestOrgId = req.headers['x-organization-id'];
    if (!requestOrgId || requestOrgId !== organizationId) {
      return res.status(403).json({ 
        success: false,
        error: 'Organización no autorizada'
      });
    }

    const organizationSlug = slugify(organizationName, { lower: true, strict: true });
    let uploadPath;

    // Determinar el path y validar según el tipo
    switch(type) {
      case 'avatars':
        if (!organizationName || !organizationId) {
          return res.status(400).json({ 
            success: false,
            error: 'Se requieren organizationName y organizationId para avatares'
          });
        }
        uploadPath = `${organizationSlug}-${organizationId}/users/avatars`;
        break;

      case 'documents':
        if (!organizationName || !organizationId || !companyName || !companyId) {
          return res.status(400).json({ 
            success: false,
            error: 'Se requieren organizationName, organizationId, companyName y companyId para documentos'
          });
        }
        const companySlug = slugify(companyName, { lower: true, strict: true });
        uploadPath = `${organizationSlug}-${organizationId}/${companySlug}-${companyId}/documentos`;
        break;

      default: // Para proyectos y otros casos existentes
        if (!organizationName || !organizationId || !projectName || !projectId) {
          return res.status(400).json({ 
            success: false,
            error: 'Se requieren organizationName, organizationId, projectName y projectId para proyectos'
          });
        }
        const projectSlug = slugify(`${projectName}-${projectId}`, { lower: true, strict: true });
        uploadPath = `${organizationSlug}-${organizationId}/${projectSlug}/imagenes`;
    }

    console.log('Backend - Upload Path:', uploadPath);

    const upload = multer({
      storage: multerS3({
        s3: s3,
        bucket: process.env.S3_BUCKET_NAME,
        metadata: function (req, file, cb) {
          cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
          const sanitizedFilename = sanitizeFilename(file.originalname);
          cb(null, `${uploadPath}/${Date.now()}-${sanitizedFilename}`);
        },
      }),
      fileFilter: function(req, file, cb) {
        console.log('Validando tipo de archivo:', file.mimetype);
        
        if (type === 'documents') {
          if (!ALLOWED_DOCUMENT_TYPES[file.mimetype]) {
            return cb(new Error('Tipo de archivo no permitido. Solo se permiten PDF, DOC, DOCX, XLS y XLSX.'), false);
          }
        } else {
          if (!ALLOWED_IMAGE_TYPES[file.mimetype]) {
            return cb(new Error('Tipo de archivo no permitido. Solo se permiten imágenes JPG, PNG y GIF.'), false);
          }
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB límite
      }
    });

    // Manejamos errores de multer
    const uploadMiddleware = (req, res) => {
      return new Promise((resolve, reject) => {
        upload.single('file')(req, res, (err) => {
          if (err) {
            if (err instanceof multer.MulterError) {
              reject({
                success: false,
                error: 'Error al subir archivo',
                details: err.message,
                code: 'MULTER_ERROR'
              });
            } else {
              reject({
                success: false,
                error: err.message,
                code: 'VALIDATION_ERROR'
              });
            }
          } else {
            resolve(req.file);
          }
        });
      });
    };

    try {
      const file = await uploadMiddleware(req, res);
      
      if (!file) {
        return res.status(400).json({
          success: false,
          error: 'No se seleccionó ningún archivo'
        });
      }

      console.log('Backend - Archivo subido exitosamente');
      console.log('Backend - Ubicación del archivo:', file.location);
      
      return res.status(200).json({ 
        success: true,
        url: file.location,
        filename: file.originalname,
        contentType: file.mimetype,
        size: file.size
      });

    } catch (uploadError) {
      console.error('Error en upload middleware:', uploadError);
      return res.status(400).json(uploadError);
    }

  } catch (error) {
    console.error('Error general en el handler:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
}