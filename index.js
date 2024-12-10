const { S3Client, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs").promises;
const fsOld = require("fs");
const path = require("path");
const ffmpeg = require('fluent-ffmpeg');
const stream = require('stream');
const { promisify } = require('util');

const pipeline = promisify(stream.pipeline);

const RESOLUTIONS = [
    { name: "360p", width: 480, height: 360 },
    { name: "480p", width: 858, height: 480 },
    { name: "720p", width: 1280, height: 720 },
];

const s3Client = new S3Client({
    region: "us-east-1",
    credentials: {
        accessKeyId: "AKIAYS2NW7KBSV7467QL",
        secretAccessKey: "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",
    },
});

const BUCKET_NAME = process.env.BUCKET_NAME;
const KEY = process.env.KEY;

async function init() {
    try {
        // Download video from S3
        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: KEY,
        });
        const result = await s3Client.send(command);
        const originalFilePath = `original-video.mp4`;

        await pipeline(result.Body, fsOld.createWriteStream(originalFilePath));
        const originalVideoPath = path.resolve(originalFilePath);

        // Extract the base file name without extension
        const baseFileName = path.basename(KEY, path.extname(KEY));

        // Loop over each resolution and generate HLS playlist and segments
        const promises = RESOLUTIONS.map((resolution) => {
            const outputDir = `output-${resolution.name}`;
            const playlistFile = `${outputDir}/index.m3u8`;

            return new Promise((resolve, reject) => {
                // Ensure output directory exists
                fsOld.mkdirSync(outputDir, { recursive: true });

                ffmpeg(originalVideoPath)
                    .outputOptions([
                        `-vf scale=${resolution.width}:${resolution.height}`, // Scale video to desired resolution
                        '-codec:v libx264', // Video codec
                        '-codec:a aac', // Audio codec
                        '-hls_time 10', // Set the segment length in seconds
                        '-hls_playlist_type vod', // Set the playlist type to VOD
                        `-hls_segment_filename ${outputDir}/segment%03d.ts`, // Segment file naming
                        '-start_number 0', // Start numbering segments from 0
                    ])
                    .output(playlistFile) // Output playlist file
                    .on('start', () => console.log(`Start transcoding ${resolution.name}`))
                    .on('end', async () => {
                        console.log(`Completed transcoding ${resolution.name}`);

                        // Upload playlist and segments to S3
                        const files = await fs.readdir(outputDir);
                        for (const file of files) {
                            const filePath = path.join(outputDir, file);
                            const fileStream = fsOld.createReadStream(filePath);
                            
                            // Create the S3 key with the base file name and resolution
                            const s3Key = `${baseFileName}_${resolution.name}/${file}`;

                            const putCommand = new PutObjectCommand({
                                Bucket: "production-video-shivankur",
                                Key: s3Key,
                                Body: fileStream,
                                ContentType: file.endsWith('.m3u8') ? 'application/x-mpegURL' : 'video/MP2T',
                            });

                            await s3Client.send(putCommand);
                            console.log(`Uploaded ${file} to S3 at ${s3Key}`);
                        }

                        resolve();
                    })
                    .on('error', (err) => reject(err))
                    .run();
            });
        });

        await Promise.all(promises);
        process.exit(0);
    } catch (error) {
        console.error("Error during processing:", error);
        process.exit(1);
    }
}

init();
