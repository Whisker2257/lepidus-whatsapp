import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand
  } from '@aws-sdk/client-s3';
  import { cfg } from '../config.js';
  import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
  
  const s3 = new S3Client({ region: cfg.s3.region });
  
  export async function uploadBuffer(buffer, key) {
    await s3.send(
      new PutObjectCommand({
        Bucket: cfg.s3.bucket,
        Key: key,
        Body: buffer,
        ContentType: 'application/pdf'
      })
    );
  
    // Signed URL valid for 7 days
    const url = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: cfg.s3.bucket, Key: key }),
      { expiresIn: 60 * 60 * 24 * 7 }
    );
    return url;
  }
  