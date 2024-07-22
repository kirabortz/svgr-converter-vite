import React, { useState } from 'react';
import './FileUploader.css';

export const FileUploader = () => {
    const [svgFiles, setSvgFiles] = useState([]);

    const handleFileUpload = (event) => {
        const files = Array.from(event.target.files);
        const validFiles = files.filter(file => file.type === 'image/svg+xml');

        const readers = validFiles.map(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                setSvgFiles(prevFiles => [...prevFiles, { name: file.name, content: e.target.result }]);
            };
            reader.readAsText(file);
            return reader;
        });
    };

    const handleDragOver = (event) => {
        event.preventDefault();
    };

    const handleDrop = (event) => {
        event.preventDefault();
        const files = Array.from(event.dataTransfer.files);
        const validFiles = files.filter(file => file.type === 'image/svg+xml');

        const readers = validFiles.map(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                setSvgFiles(prevFiles => [...prevFiles, { name: file.name, content: e.target.result }]);
            };
            reader.readAsText(file);
            return reader;
        });
    };

    const handleClick = () => {
        document.querySelector('.upload-zone input').click();
    };

    const handleDownload = async () => {
        const formData = new FormData();
        svgFiles.forEach(file => {
            const blob = new Blob([file.content], { type: 'image/svg+xml' });
            formData.append('files', blob, file.name);
        });

        const response = await fetch('/upload', {
            method: 'POST',
            body: formData,
        });

        const blob = await response.blob();

        const url = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'components.zip';
        document.body.appendChild(a);
        a.click();
        a.remove();
    };

    return (
        <div className="svg-uploader">
            <h1 className={'title'}>SVG to React Components</h1>
            <div
                className="upload-zone"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={handleClick}
            >
                <input type="file" accept="image/svg+xml" onChange={handleFileUpload} multiple />
                <p>Перетащите SVG файлы сюда или кликните для выбора</p>
            </div>
            {svgFiles.length > 0 && (
                <div className="preview-zone">
                    <h2>Uploaded icons:</h2>
                    <div className="icon-container">
                        {svgFiles.map((file, index) => (
                            <div key={index} className="icon-item">
                                <div className="icon-wrapper" dangerouslySetInnerHTML={{ __html: file.content }} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {svgFiles.length > 0 && (
                <button onClick={handleDownload} className='download-button'>Download</button>
            )}
        </div>
    );
};

