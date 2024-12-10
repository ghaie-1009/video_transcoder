"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const multer_1 = __importDefault(require("multer"));
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const fs_1 = __importDefault(require("fs"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
const PORT = 3001;
app.use((0, cors_1.default)({
    origin: "*", // React app's origin
    methods: 'GET,POST',
    allowedHeaders: 'Content-Type',
}));
// Configure multer for file uploads
const upload = (0, multer_1.default)({ dest: 'uploads/' }); // Temporary storage directory
// Configure AWS S3
aws_sdk_1.default.config.update({
    accessKeyId: "AKIAYS2NW7KBSV7467QL",
    secretAccessKey: "RG1Sa3ImwuzAjvz/YUj3GGjBlAb4ozvlwDSH0xDq",
    region: "us-east-1" // e.g., 'us-west-2'
});
const s3 = new aws_sdk_1.default.S3();
// Upload endpoint
app.post('/upload', upload.single('video'), (req, res) => {
    const file = req.file;
    if (!file) {
        return res.status(400).send('No file uploaded.');
    }
    // Get the original file name and extension
    const originalName = file.originalname;
    // Set up parameters for S3 upload with the original file name
    const uploadParams = {
        Bucket: "upload-video-shivankur",
        Key: originalName, // Use original file name as key
        Body: fs_1.default.createReadStream(file.path),
        ContentType: file.mimetype // Ensure the content type is set correctly
    };
    // Upload file to S3
    s3.upload(uploadParams, (err, data) => {
        if (err) {
            console.error('Error uploading to S3:', err);
            return res.status(500).send('Failed to upload video.');
        }
        console.log('Video uploaded to S3:', data.Location);
        res.send('Video uploaded successfully!');
    });
});
// Endpoint to start the consumer process
app.get('/', (req, res) => {
    const scriptPath = path_1.default.join(__dirname, 'index.ts');
    const child = (0, child_process_1.exec)(`ts-node ${scriptPath}`, (error, stdout, stderr) => {
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
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
