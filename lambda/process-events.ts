import { S3 } from 'aws-sdk';
import { Context, Handler } from 'aws-lambda';

// Initialize the S3 client
const s3 = new S3();

// Get the bucket name from environment variables
const bucketName = process.env.BUCKET_NAME!;

export const handler: Handler = async (event: any, context: Context) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  // Define the S3 object key, here using the request ID to ensure uniqueness
  const objectKey = `checkrun-events/${context.awsRequestId}.json`;

  // Define the S3 putObject parameters
  const params = {
    Bucket: bucketName,
    Key: objectKey,
    Body: JSON.stringify(event),
    ContentType: 'application/json',
  };

  try {
    // Upload the event data to S3
    await s3.putObject(params).promise();
    console.log(`Successfully saved event to ${bucketName}/${objectKey}`);
  } catch (error) {
    // Type guard to ensure 'error' is of type 'Error'
    if (error instanceof Error) {
      console.error(`Failed to save event to S3: ${error.message}`);
    } else {
      // Fallback for non-Error type exceptions
      console.error('An unknown error occurred:', error);
    }
  }
};
