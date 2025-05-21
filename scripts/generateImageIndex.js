const fs = require('fs');
const path = require('path');

const imageDir = path.join(__dirname, '../assets/images/listing-images');

// Read all image files from the directory
const imageFiles = fs.readdirSync(imageDir)
  .filter(file => {
    // Filter only image files and exclude the index.ts itself
    const ext = path.extname(file).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.gif'].includes(ext) && file !== 'index.ts';
  });

// Generate the index.ts content
const indexContent = `// This file is auto-generated. Do not edit it manually.
export default {
${imageFiles.map(file => `  '${file}': require('./${file}')`).join(',\n')}
} as const;
`;

// Write the index.ts file
fs.writeFileSync(
  path.join(imageDir, 'index.ts'),
  indexContent
);

console.log('Image index file generated successfully!');
