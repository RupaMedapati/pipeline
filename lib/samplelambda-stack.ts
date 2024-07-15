import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

interface LambdaStackProps extends cdk.StackProps {
  existingBucketName: string;
  existingEventBusArn: string;
}

export class LambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    // Import the existing S3 bucket
    const bucket = s3.Bucket.fromBucketName(this, 'ExistingBucket', props.existingBucketName);

    // Import the existing EventBridge event bus
    const eventBus = events.EventBus.fromEventBusArn(this, 'ExistingEventBus', props.existingEventBusArn);

    // Create the Lambda function
    const lambdaFunction = new lambda.Function(this, 'ProcessCheckRunEvents', {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset('lambda'), // This assumes your code is in the lambda directory
      handler: 'process-events.handler',
      environment: {
        BUCKET_NAME: bucket.bucketName,
      },
    });

    // Grant the Lambda function write permissions to the S3 bucket
    bucket.grantWrite(lambdaFunction);
    const dlq = new sqs.Queue(this, 'DeadLetterQueue', {
      retentionPeriod: cdk.Duration.days(14),
    });

    // Create an EventBridge rule to invoke the Lambda function
    new events.Rule(this, 'CheckRunEventRule', {
      eventBus: eventBus,
      eventPattern: {
        source: ['github'],
        detailType: ['checkrun'],
      },
      targets: [
        new targets.LambdaFunction(lambdaFunction, {
        deadLetterQueue: dlq, // Add the DLQ to the target configuration
          maxEventAge: cdk.Duration.hours(24), // Event age limit of 24 hours
          retryAttempts: 3, // Retry up to 3 times
      }),
    ],
    });
  }
}
