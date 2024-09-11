# Video Transcoder Application

## Overview

This project is a video transcoder that converts uploaded MP4 files into multiple formats (360p, 480p, and 720p) and stores them in an Amazon S3 bucket. The transcoding is done using FFmpeg in a Docker container running on AWS ECS Fargate. The frontend is built with React and allows users to upload videos, and then view the transcoded outputs once they are processed.

## Features

- **Video Upload**: Users can upload MP4 videos through a React frontend.
- **Multi-Resolution Transcoding**: The uploaded video is transcoded into 360p, 480p, and 720p resolutions.
- **HLS Streaming Format**: The transcoded videos are saved in the HLS format with `.m3u8` playlists and `.ts` segments.
- **AWS Integration**: S3 is used for storing the uploaded and transcoded videos, while SQS queues are used to manage transcoding tasks.
- **Scalable Transcoding**: Transcoding tasks are processed in Docker containers orchestrated by ECS Fargate.

## Technologies Used

- **Frontend**: React.js (for the user interface)
- **Backend**: Node.js with Express, TypeScript
- **Video Processing**: FFmpeg (for transcoding)
- **Cloud Services**: 
  - **AWS S3**: Used for storing uploaded and transcoded videos.
  - **AWS SQS**: Queues for managing video transcoding jobs.
  - **AWS ECS Fargate**: For running Docker containers that perform video transcoding.

## Architecture

1. **User Uploads Video**: The user uploads an MP4 file via the React frontend. The video is then stored in an S3 bucket (Upload Bucket).
2. **SQS Notification**: Once a video is uploaded, an SQS message is sent to trigger the transcoding process.
3. **ECS Fargate Transcoding**: A Node.js service listens to the SQS queue, triggers an ECS Fargate task to run FFmpeg in a Docker container to transcode the video.
4. **Transcoded Video Storage**: The transcoded videos are stored in a separate S3 bucket (Production Bucket), organized by resolution (360p, 480p, 720p), and HLS files (`index.m3u8` and video segments).
5. **Frontend Polling**: The React app periodically polls the backend for transcoded video URLs and updates the UI once the videos are ready.

## How to Run the Project

### Prerequisites

- Node.js (version 14.x or higher)
- pnpm (preferred) or npm/yarn
- AWS account (with S3, SQS, and ECS services configured)
- Docker (for local development and building the transcoder image)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/video-transcoder-app.git
2. Navigate to the project directory:
   ```bash
   cd video-transcoder-app
3. Install the dependencies:
   ```bash
   pnpm install

### AWS Setup

1. S3 Buckets:
   - Create two S3 buckets: one for uploading videos (Upload Bucket) and another for storing transcoded videos (Production Bucket).
2. SQS Queue:
   - Create an SQS queue to handle video transcoding jobs.
3. ECS Fargate Setup:
   - Build a Docker image containing FFmpeg.
   - Push the image to Amazon ECR (Elastic Container Registry).
   - Set up an ECS Fargate service that runs the Docker container to transcode videos.

### Running the Project

1. Start the React frontend:
   ```bash  
    pnpm start
  This will start the frontend on http://localhost:3000.

2. Start the Node.js backend:
   ```bash
   pnpm run server
   
3. **Upload a video:** Use the frontend to upload a video to the Upload Bucket. The backend will handle queuing the job for transcoding.
4. **Monitor transcoding:** Once the transcoding process completes, the transcoded videos will appear in the Production Bucket. The frontend will display the available resolutions.

### Build for Production

To create a production build of the frontend:
  ```bash
     pnpm run server
  ```
This will generate optimized files in the build directory.   

### Deploying the Backend

You can deploy the backend on any cloud service or use AWS Lambda with API Gateway for serverless deployment.

## Future Improvements

- Adding support for additional video formats.
- Real-time progress updates for transcoding jobs.
- Better error handling and retry mechanisms.
- Implementing authentication for secure video upload and access.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.
