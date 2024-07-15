import * as cdk from 'aws-cdk-lib';
import { LambdaStack } from '../lib/samplelambda-stack';

const app = new cdk.App();

new LambdaStack(app, 'LambdaStack', {
  existingBucketName: 'processed-checkrun-events-bucket',
  existingEventBusArn: 'arn:aws:events:us-east-1:141313065773:event-bus/manualcreatedeventbus',
});

