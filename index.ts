import { ReceiveMessageCommand, SQSClient, DeleteMessageCommand } from "@aws-sdk/client-sqs";
import {ECSClient, RunTaskCommand} from "@aws-sdk/client-ecs"
import type { S3Event } from "aws-lambda"

const client = new SQSClient({
    region: "us-east-1",
    credentials: {
        accessKeyId: "AKIAYS2NW7KBSV7467QL",
        secretAccessKey: "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",
    },
});

const ecsClient = new ECSClient({
    region: "us-east-1",
    credentials: {
        accessKeyId: "AKIAYS2NW7KBSV7467QL",
        secretAccessKey: "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",
    },
});

async function init(){
    const command = new ReceiveMessageCommand({
        QueueUrl: "https://sqs.us-east-1.amazonaws.com/590184118915/VideoTranscodingQueue",
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: 20
    });

    while(true){
        const { Messages } = await client.send(command);
        if(!Messages){
            console.log(`No Message Recieved`);
            continue;
        }

        try {
            for(const message of Messages){
                const {MessageId, Body} = message;
                console.log(`Message Recieved`, {MessageId, Body});
                
                if(!Body) continue;
    
                const event = JSON.parse(Body) as S3Event;

                if("Service" in event && "Event" in event){
                    if(event.Event == "s3.TestEvent"){
                        await client.send(new DeleteMessageCommand({
                            QueueUrl: "https://sqs.us-east-1.amazonaws.com/590184118915/VideoTranscodingQueue",
                            ReceiptHandle: message.ReceiptHandle,
                        }));
                        continue; 
                    }
                }

                for(const record of event.Records){
                    const {s3} = record;
                    const {
                        bucket,
                        object: {key},
                    } = s3;
                    const runTaskCommand = new RunTaskCommand({
                        taskDefinition: "arn:aws:ecs:us-east-1:590184118915:task-definition/video-transcoder",
                        cluster: "arn:aws:ecs:us-east-1:590184118915:cluster/transcoder_",
                        launchType: "FARGATE",
                        networkConfiguration: {                            
                            awsvpcConfiguration: {
                                assignPublicIp: "ENABLED",
                                securityGroups: ['sg-0035a950904c77417'],
                                subnets: ['subnet-0742ae26c079043c8', 'subnet-00c0d6e807563b09c', 'subnet-0d3c8731c7b1e24e0'],
                            }
                        },
                        overrides: {
                            containerOverrides: [{ name: "video-transcoder", environment: [{name: 'BUCKET_NAME', value: bucket.name}, {name: 'KEY', value: key}] }],                            
                        }
                    })
                    await ecsClient.send(runTaskCommand);
                    await client.send(new DeleteMessageCommand({
                        QueueUrl: "https://sqs.us-east-1.amazonaws.com/590184118915/VideoTranscodingQueue",
                        ReceiptHandle: message.ReceiptHandle,
                    }));
                }
            }
        } catch (error) {
            console.log(error);
        }
    }
}

init();
