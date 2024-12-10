import express, { Request, Response } from 'express';
import { exec } from 'child_process';
import path from 'path';
import multer from 'multer';
import AWS from 'aws-sdk';
import fs from 'fs';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors({
    origin: "*",  // Adjust to your React app's origin
    methods: 'GET,POST',
    allowedHeaders: 'Content-Type',
}));

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });  // Temporary storage directory

// Configure AWS S3
AWS.config.update({
    accessKeyId: "AKIAYS2NW7KBSV7467QL",
    secretAccessKey: "RG1Sa3ImwuzAjvz/YUj3GGjBlAb4ozvlwDSH0xDq",
    region: "us-east-1"  // e.g., 'us-west-2'
});

const s3 = new AWS.S3();

// Utility function to generate presigned URLs
const generatePresignedUrls = async (bucketName: string, videoName: string) => {
    const resolutions = ["360p", "480p", "720p"];
    const urls: Record<string, string> = {};

    for (const resolution of resolutions) {
        const key = `${videoName}_${resolution}/index.m3u8`;
        const params = {
            Bucket: bucketName,
            Key: key,
            Expires: 3600 // 1 hour expiration
        };
        const url = s3.getSignedUrl('getObject', params);
        urls[resolution] = url;
    }

    return urls;
};

// Upload endpoint
app.post('/upload', upload.single('video'), (req: Request, res: Response) => {
    const file = req.file;
    if (!file) {
        return res.status(400).send('No file uploaded.');
    }

    const originalName = file.originalname;

    const uploadParams: AWS.S3.PutObjectRequest = {
        Bucket: "upload-video-shivankur",
        Key: originalName,  // Use original file name as key
        Body: fs.createReadStream(file.path),
        ContentType: file.mimetype  // Ensure the content type is set correctly
    };

    s3.upload(uploadParams, (err: Error | null, data: AWS.S3.ManagedUpload.SendData) => {
        if (err) {
            console.error('Error uploading to S3:', err);
            return res.status(500).send('Failed to upload video.');
        }

        console.log('Video uploaded to S3:', data.Location);
        res.send('Video uploaded successfully!');
    });
});

// Endpoint to start the consumer process
app.get('/', (req: Request, res: Response) => {
    const scriptPath = path.join(__dirname, 'index.ts');

    const child = exec(`ts-node ${scriptPath}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return res.status(500).send('Failed to start consumer process');
        }
        if (stderr) {
            console.error(`Stderr: ${stderr}`);
            return res.status(500).send('Error in consumer process');
        }
        console.log(`Stdout: ${stdout}`);
        res.send('Consumer process started successfully');
    });

    child.on('exit', (code) => {
        console.log(`Consumer process exited with code ${code}`);
    });
});

// API Endpoint to get presigned URLs for transcoded videos
app.get('/presigned-urls', async (req: Request, res: Response) => {
    const videoName = req.query.videoName as string;  // Assuming videoName is passed as a query parameter

    if (!videoName) {
        return res.status(400).json({ success: false, message: 'videoName query parameter is required.' });
    }

    console.log('Request received for presigned URLs for:', videoName);

    try {
        const urls = await generatePresignedUrls('production-video-shivankur', videoName);
        if (Object.keys(urls).length === 0) {
            console.log('No presigned URLs were generated.');
            return res.status(404).json({ success: false, message: 'Presigned URLs not found.' });
        }

        console.log('Presigned URLs generated:', urls);
        res.json({ success: true, urls });
    } catch (error) {
        console.error('Error generating presigned URLs:', error);
        res.status(500).json({ success: false, message: 'Failed to generate presigned URLs.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
