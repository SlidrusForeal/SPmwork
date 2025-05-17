const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const sizes = [
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' },
];

async function generateIcons() {
  // Используем PNG как исходный формат
  const sourcePath = path.join(__dirname, '..', 'public', 'logo.png');
  
  // Проверяем существование исходного файла
  if (!fs.existsSync(sourcePath)) {
    console.error('Source image (logo.png) not found in public directory!');
    console.log('Please place a high-resolution PNG image (at least 512x512) named "logo.png" in the public directory.');
    return;
  }

  try {
    // Генерируем иконки разных размеров
    for (const { size, name } of sizes) {
      const outputPath = path.join(__dirname, '..', 'public', name);
      
      await sharp(sourcePath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputPath);

      console.log(`Generated ${name} (${size}x${size})`);
    }

    // Генерируем favicon.ico
    await sharp(sourcePath)
      .resize(64, 64, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .toFormat('png')
      .toFile(path.join(__dirname, '..', 'public', 'favicon.ico'));

    console.log('All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons(); 