import express from 'express';
import multer from 'multer';
import { transform } from '@svgr/core';
import JSZip from 'jszip';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

app.use(express.static(path.join(__dirname, '..')));

// app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, '..', 'index.html'));
// });

app.post('/upload', upload.array('files'), async (req, res) => {
    const processedFiles = [];
    const exportStatements = [];

    for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const baseName = file.originalname.replaceAll(' ', '-').replaceAll('(', '').replaceAll(')', '').toLowerCase().replace('.svg', '');
        const newName = `${capitalizeFirstLetter(baseName)}.tsx`;
        const componentName = `Svg${capitalizeFirstLetter(baseName)}`;
        const fileContent = file.buffer.toString('utf8');

        try {
            const jsxContent = await transform(fileContent, {
                jsxRuntime: 'automatic',
                typescript: true,
                ref: true,
                memo: true,
                icon: true,
            });

            if (jsxContent === fileContent) {
                console.warn('JSX Content is the same as the original file content. Transformation might not have worked.');
            }

            let newFileContent = jsxContent.replaceAll(/fill="(url\(#[^"]+\)|#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})|[a-zA-Z]+|rgb\([^)]+\)|rgba\([^)]+\))"/g, `fill={'currentcolor'}`);

            newFileContent = newFileContent.replace(/const SvgComponent =/, `const ${componentName} =`);
            newFileContent = newFileContent.replace(/export default SvgComponent;/, `export default ${componentName};`);

            processedFiles.push({ name: newName, content: newFileContent });
            exportStatements.push(`export { default as ${componentName} } from './${newName.replace('.tsx', '')}';`);
        } catch (error) {
            console.error('Error transforming SVG:', error);
        }
    }

    const indexFileContent = exportStatements.join('\n');
    processedFiles.push({ name: 'index.ts', content: indexFileContent });

    const zip = new JSZip();
    processedFiles.forEach(file => {
        zip.file(file.name, file.content);
    });

    try {
        const content = await zip.generateAsync({ type: 'nodebuffer' });
        res.set('Content-Type', 'application/zip');
        res.set('Content-Disposition', 'attachment; filename=components.zip');
        res.send(content);
    } catch (error) {
        console.error('Error generating zip:', error);
        res.status(500).send('Error generating zip');
    }
});

export default app;