export const cfg = {
    twilio: {
      sid: process.env.TWILIO_ACCOUNT_SID,
      token: process.env.TWILIO_AUTH_TOKEN,
      from: process.env.TWILIO_WHATSAPP_FROM
    },
    openaiKey: process.env.OPENAI_API_KEY,
    mathpix: {
      id: process.env.MATHPIX_APP_ID,
      key: process.env.MATHPIX_APP_KEY
    },
    s3: {
      bucket: process.env.AWS_S3_BUCKET,
      region: process.env.AWS_REGION
    },
    baseUrl: process.env.BASE_URL
  };
  