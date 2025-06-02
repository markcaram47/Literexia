const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.AWS_S3_BUCKET || process.env.AWS_BUCKET_NAME;

async function uploadToS3(file, folder = '') {
  const ext = path.extname(file.originalname);
  const filename = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
  const key = folder ? `${folder}/${filename}` : filename;

  const params = {
    Bucket: BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read',
  };

  await s3.send(new PutObjectCommand(params));

  // Return the public URL
  return `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

module.exports = uploadToS3; 