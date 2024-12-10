import React, { useState } from 'react';
import axios from 'axios';

const App = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadStatus, setUploadStatus] = useState('');
    const [videoUrls, setVideoUrls] = useState({});

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setUploadStatus('Please select a file first.');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('video', selectedFile);

            // Upload the video file to the server
            const response = await axios.post('http://localhost:3001/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.status === 200) {
                setUploadStatus('Video uploaded successfully!');
                
                // Start the consumer process
                await axios.get('http://localhost:3001/');
                
                // Delay to allow backend processing, then fetch presigned URLs
                setTimeout(async () => {
                    await fetchPresignedUrls();
                }, 10000); // 10 seconds delay
            }
        } catch (error) {
            setUploadStatus('Failed to upload video.');
            console.error(error);
        }
    };

    const fetchPresignedUrls = async () => {
        try {
            const response = await axios.get('http://localhost:3001/presigned-urls');
            if (response.status === 200 && response.data.success) {
                setVideoUrls(response.data.urls);
                setUploadStatus('Presigned URLs retrieved successfully!');
            } else {
                setUploadStatus('Failed to retrieve presigned URLs.');
            }
        } catch (error) {
            setUploadStatus('Error retrieving presigned URLs.');
            console.error(error);
        }
    };

    return (
        <div>
            <h1>Upload a Video</h1>
            <input type="file" onChange={handleFileChange} />
            <button onClick={handleUpload}>Upload</button>
            {uploadStatus && <p>{uploadStatus}</p>}

            {Object.keys(videoUrls).length > 0 && (
                <div>
                    <h2>Watch the Transcoded Video</h2>
                    {Object.entries(videoUrls).map(([resolution, url]) => (
                        <div key={resolution}>
                            <h3>{resolution}</h3>
                            <video controls>
                                <source src={url} type="application/x-mpegURL" />
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default App;
