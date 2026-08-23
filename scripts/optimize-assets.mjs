import sharp from 'sharp';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import ffmpegPath from 'ffmpeg-static';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assets = path.join(__dirname, '..', 'client', 'src', 'assets');
const publicDir = path.join(__dirname, '..', 'client', 'public');
const sounds = path.join(assets, 'sounds');

const jobs = [
    // [input, output, width, format, quality]
    [path.join(publicDir, 'Applogo.png'), path.join(publicDir, 'Applogo-opt.png'), 512, 'png', null],
    [path.join(assets, 'Applogo.png'), path.join(assets, 'Applogo.webp'), 256, 'webp', 90],
    [path.join(assets, 'AppLogo4k.png'), path.join(assets, 'AppLogo4k.webp'), 512, 'webp', 90],
    [path.join(assets, 'Owner-dashbord.png'), path.join(assets, 'Owner-dashbord.webp'), 1200, 'webp', 78],
    [path.join(assets, 'Management-Dashbord.png'), path.join(assets, 'Management-Dashbord.webp'), 1200, 'webp', 78],
    [path.join(assets, 'Warden-Dashbord.png'), path.join(assets, 'Warden-Dashbord.webp'), 1200, 'webp', 78],
    [path.join(assets, 'Student-Dashbord.png'), path.join(assets, 'Student-Dashbord.webp'), 1200, 'webp', 78],
    [path.join(assets, 'DeveploersImages', 'Backenddeveloper.png'), path.join(assets, 'DeveploersImages', 'Backenddeveloper.webp'), 512, 'webp', 85],
    [path.join(assets, 'NoDataDark.png'), path.join(assets, 'NoDataDark.webp'), 800, 'webp', 82],
    [path.join(assets, 'NoData.avif'), path.join(assets, 'No-Data-opt.avif'), 800, 'avif', 60],
];

const kb = (p) => `${(existsSync(p) ? 0 : 0).toFixed(0)}`;

for (const [input, output, width, format, quality] of jobs) {
    if (!existsSync(input)) {
        console.log(`SKIP (missing): ${input}`);
        continue;
    }
    let pipeline = sharp(input).resize({ width, withoutEnlargement: true });
    if (format === 'webp') pipeline = pipeline.webp({ quality });
    if (format === 'avif') pipeline = pipeline.avif({ quality });
    if (format === 'png') pipeline = pipeline.png({ palette: true, quality: 90, compressionLevel: 9 });
    const info = await pipeline.toFile(output);
    console.log(`OK: ${path.basename(output)} ${Math.round(info.size / 1024)}KB`);
}

// Audio: emergency-warning.mp3 -> compressed AAC (.m4a)
const mp3 = path.join(sounds, 'emergency-warning.mp3');
const m4a = path.join(sounds, 'emergency-warning-opt.m4a');
if (existsSync(mp3) && !existsSync(m4a)) {
    const { execFileSync } = await import('child_process');
    execFileSync(ffmpegPath, ['-y', '-i', mp3, '-c:a', 'aac', '-b:a', '48k', '-ac', '1', '-ar', '22050', m4a], { stdio: 'pipe' });
    console.log(`OK: emergency-warning-opt.m4a`);
} else {
    console.log('SKIP audio (already done or missing)');
}
console.log('DONE');
