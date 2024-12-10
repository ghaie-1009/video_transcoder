# Video Transcoder Application

A scalable video transcoding application that takes MP4 videos and converts them into 360p, 480p, and 720p formats in HLS format. The system leverages AWS S3 for storage, AWS SQS for queuing, ECS Fargate for processing, and FFmpeg for transcoding.

---

## Features

- Upload MP4 videos via a React frontend.
- Transcode videos into 360p, 480p, and 720p HLS formats.
- Store transcoded videos in separate folders in an S3 bucket.
- Scalable and serverless architecture using AWS services.
- Status updates for transcoding progress.

---

## Architecture Overview

1. **Frontend**: React app with a video upload feature.
2. **Backend**: Node.js with TypeScript and Express for managing uploads and generating transcoding jobs.
3. **AWS Services**:
   - **S3 Buckets**: 
     - Upload bucket for raw videos.
     - Production bucket for transcoded videos (HLS format).
   - **SQS Queue**: Handles upload events and notifies the transcoder service.
   - **ECS Fargate**: Spins up containers running FFmpeg to transcode videos.
4. **FFmpeg**: Used for converting videos to HLS format with segmented resolutions.

---


---

## Getting Started

### Prerequisites

- AWS Account with S3, SQS, and ECS configured.
- Node.js and pnpm installed.
- Docker installed.

---

### Frontend Setup

1. Navigate to the `frontend` folder:
   ```bash
   cd frontend
2. Install dependencies
   ```bash
   pnpm install
3. Start the development server
   ```bash
   pnpm start

---

### Backend Setup

1. Navigate to the backend folder
   ```bash
   cd backend
2. Install dependencies
   ```bash
   pnpm install
3. Start the server
   ```bash
   pnpm start

---

### AWS Configuration

1. S3 Bucket:

  Create two buckets:
    upload-bucket: For storing uploaded videos.
    transcoded-bucket: For storing HLS-formatted videos.
    
2. SQS Queue:

Configure an SQS queue to handle upload events.

3. ECS Fargate:

Deploy a container running FFmpeg to transcode videos.

---

## Transcoding Process

1. Upload a video via the React app.
2. Backend uploads the file to the S3 upload bucket.
3. An SQS message is triggered for the new upload.
4. The ECS Fargate container picks up the message and transcodes the video using FFmpeg.
5. The transcoded videos are stored in the production bucket under respective resolution folders.

---

## Technology Stack

Frontend: React, Axios
Backend: Node.js, Express, TypeScript, Multer
AWS: S3, SQS, ECS Fargate
Tools: Docker, FFmpeg


## Future Improvements

1. Add support for additional video formats.
2. Implement a notification system for video transcoding completion.
3. Use Lambda for lightweight video processing tasks.



