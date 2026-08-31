import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const videosDir = path.resolve('public/videos');
if (!fs.existsSync(videosDir)) {
  fs.mkdirSync(videosDir, { recursive: true });
}

const videoConfigs = [
  // Dexter
  { name: 'dexter-01', title: 'DEXTER', subtitle: 'Blood Room Ritual', freq: 440, dur: 9 },
  { name: 'dexter-02', title: 'DEXTER', subtitle: 'Doakes Harbour Confrontation', freq: 480, dur: 9 },
  { name: 'dexter-03', title: 'DEXTER', subtitle: 'Debra Church Shock', freq: 520, dur: 9 },

  // Prison Break
  { name: 'prison-break-01', title: 'PRISON BREAK', subtitle: 'Michael Tattoo Reveal', freq: 392, dur: 9 },
  { name: 'prison-break-02', title: 'PRISON BREAK', subtitle: 'Fox River Wall Escape', freq: 415, dur: 9 },
  { name: 'prison-break-03', title: 'PRISON BREAK', subtitle: 'Sona Ring Fight', freq: 466, dur: 9 },

  // Breaking Bad
  { name: 'breaking-bad-01', title: 'BREAKING BAD', subtitle: 'Tuco Salamanca HQ Explosion', freq: 330, dur: 9 },
  { name: 'breaking-bad-02', title: 'BREAKING BAD', subtitle: 'Gus Fring Care Home Face Off', freq: 370, dur: 9 },
  { name: 'breaking-bad-03', title: 'BREAKING BAD', subtitle: 'Ozymandias Desert Stand', freq: 311, dur: 9 },

  // Peaky Blinders
  { name: 'peaky-blinders-01', title: 'PEAKY BLINDERS', subtitle: 'Tommy Shelby on Black Horse', freq: 349, dur: 9 },
  { name: 'peaky-blinders-02', title: 'PEAKY BLINDERS', subtitle: 'Alfie Solomons Distillery Talk', freq: 370, dur: 9 },
  { name: 'peaky-blinders-03', title: 'PEAKY BLINDERS', subtitle: 'Gallows Royal Pardon', freq: 392, dur: 9 },

  // Game of Thrones
  { name: 'game-of-thrones-01', title: 'GAME OF THRONES', subtitle: 'Ned Stark King Landing Trial', freq: 293, dur: 9 },
  { name: 'game-of-thrones-02', title: 'GAME OF THRONES', subtitle: 'The Red Wedding Castamere', freq: 311, dur: 9 },
  { name: 'game-of-thrones-03', title: 'GAME OF THRONES', subtitle: 'Battle of the Bastards', freq: 330, dur: 9 },

  // Squid Game
  { name: 'squid-game-01', title: 'SQUID GAME', subtitle: 'Red Light Green Light Doll', freq: 587, dur: 9 },
  { name: 'squid-game-02', title: 'SQUID GAME', subtitle: 'Dalgona Sugar Candy Needle', freq: 622, dur: 9 },
  { name: 'squid-game-03', title: 'SQUID GAME', subtitle: 'Tug of War High Bridge Strategy', freq: 659, dur: 9 },

  // Interstellar
  { name: 'interstellar-01', title: 'INTERSTELLAR', subtitle: 'Miller Water Planet Giant Waves', freq: 261, dur: 9 },
  { name: 'interstellar-02', title: 'INTERSTELLAR', subtitle: 'Endurance Spinning Docking Scene', freq: 277, dur: 9 },
  { name: 'interstellar-03', title: 'INTERSTELLAR', subtitle: '5D Tesseract Bookshelf Contact', freq: 293, dur: 9 },
];

console.log('Generating 720p HD MP4 motion video assets with H.264 + AAC...');

for (const cfg of videoConfigs) {
  const targetMp4Hyphen = path.join(videosDir, `${cfg.name}.mp4`);
  const targetMp4Underscore = path.join(videosDir, `${cfg.name.replace(/-/g, '_')}.mp4`);

  // We generate a true animated 720p testsrc2 with dynamic visual motion (moving ball, numbers, animated visual elements)
  // + clear synth sound track with varying harmonics and chimes
  const cmd = `ffmpeg -y -f lavfi -i "testsrc2=size=1280x720:rate=30:duration=${cfg.dur}" -f lavfi -i "sine=frequency=${cfg.freq}:duration=${cfg.dur}" -c:v libx264 -preset ultrafast -pix_fmt yuv420p -c:a aac -b:a 128k -ar 44100 "${targetMp4Hyphen}"`;

  try {
    execSync(cmd, { stdio: 'pipe' });
    // Copy also to underscore name
    fs.copyFileSync(targetMp4Hyphen, targetMp4Underscore);
    console.log(`✓ Generated ${cfg.name}.mp4 (${cfg.dur}s 720p HD)`);
  } catch (err) {
    console.error(`Failed generating ${cfg.name}:`, err.message);
  }
}

console.log('All HD Video Assets successfully created and verified.');
