// This script generates PNG icons for the PWA using the Canvas API
const fs = require('fs');
const { createCanvas } = require('canvas');

// Generate icons with specified sizes
function generateIcon(size) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, size, size);

    // Text "2048"
    ctx.fillStyle = '#edc22e'; // Gold color like 2048 tile
    ctx.font = `bold ${size / 2.4}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('2048', size / 2, size / 2);

    // Save the image
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(`./icons/icon-${size}x${size}.png`, buffer);

    console.log(`Created ${size}x${size} icon`);
}

// Make sure icons directory exists
try {
    if (!fs.existsSync('./icons')) {
        fs.mkdirSync('./icons');
    }

    // Generate different sized icons
    generateIcon(192);
    generateIcon(512);

    console.log('All icons generated successfully');
} catch (err) {
    console.error('Error generating icons:', err);
}
