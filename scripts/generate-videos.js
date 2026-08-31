import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const videos = [
  { file: 'dexter_01.mp4', title: 'Dexter - Kill Room Ritual', color: 'darkred' },
  { file: 'dexter_02.mp4', title: 'Dexter - Doakes Stalking Harbor', color: '#550000' },
  { file: 'dexter_03.mp4', title: 'Dexter - Debra Enters Church', color: '#661111' },
  { file: 'prison_break_01.mp4', title: 'Prison Break - Tattoo Blueprint', color: '#2b2b2b' },
  { file: 'prison_break_02.mp4', title: 'Prison Break - Fox River Escape', color: '#1a2430' },
  { file: 'prison_break_03.mp4', title: 'Prison Break - Sona Fight Arena', color: '#382512' },
  { file: 'breaking_bad_01.mp4', title: 'Breaking Bad - Tuco Fulminated Mercury', color: '#102e1c' },
  { file: 'breaking_bad_02.mp4', title: 'Breaking Bad - Say My Name', color: '#2d3319' },
  { file: 'breaking_bad_03.mp4', title: 'Breaking Bad - Ozymandias Desert', color: '#3a2610' },
  { file: 'peaky_blinders_01.mp4', title: 'Peaky Blinders - Red Right Hand', color: '#1c1c1c' },
  { file: 'peaky_blinders_02.mp4', title: 'Peaky Blinders - No Fucking Fighting', color: '#28231d' },
  { file: 'peaky_blinders_03.mp4', title: 'Peaky Blinders - Gallows Scene', color: '#1a1d20' },
  { file: 'game_of_thrones_01.mp4', title: 'Game of Thrones - Ned Stark Trial', color: '#1c2233' },
  { file: 'game_of_thrones_02.mp4', title: 'Game of Thrones - Red Wedding', color: '#400e12' },
  { file: 'game_of_thrones_03.mp4', title: 'Game of Thrones - Battle of the Bastards', color: '#1f2937' },
  { file: 'squid_game_01.mp4', title: 'Squid Game - Red Light Green Light', color: '#361527' },
  { file: 'squid_game_02.mp4', title: 'Squid Game - Dalgona Candy Challenge', color: '#3b2010' },
  { file: 'squid_game_03.mp4', title: 'Squid Game - Tug of War Strategy', color: '#1b2c3b' },
  { file: 'interstellar_01.mp4', title: 'Interstellar - Ocean Planet Giant Waves', color: '#092138' },
  { file: 'interstellar_02.mp4', title: 'Interstellar - Docking Endurance Spin', color: '#0c1b29' },
  { file: 'interstellar_03.mp4', title: 'Interstellar - Tesseract 5D Library', color: '#051923' },
];

const outDir = path.join(process.cwd(), 'public', 'videos');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

console.log('Generating cinematic MP4 video assets with ffmpeg (H.264 + AAC)...');

for (const vid of videos) {
  const filePath = path.join(outDir, vid.file);
  if (fs.existsSync(filePath) && fs.statSync(filePath).size > 10000) {
    console.log(`Video ${vid.file} already exists, skipping.`);
    continue;
  }

  // Create 10-second high quality 640x360 MP4 with animated video title & audio chime
  const escapedTitle = vid.title.replace(/:/g, '\\:').replace(/'/g, '');
  const cmd = `ffmpeg -y -f lavfi -i color=c=${vid.color}:s=640x360:d=10 -f lavfi -i "sine=frequency=440:duration=10" -vf "drawtext=text='${escapedTitle}':fontcolor=white:fontsize=24:x=(w-text_w)/2:y=(h-text_h)/2-30,drawtext=text='LODEKS CINEMA SCENE':fontcolor=gold:fontsize=16:x=(w-text_w)/2:y=(h-text_h)/2+20,drawtext=text='00\\:%{eif\\:t\\:d\\:2} / 00\\:10':fontcolor=cyan:fontsize=18:x=(w-text_w)/2:y=(h-text_h)/2+60" -c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart "${filePath}"`;

  try {
    execSync(cmd, { stdio: 'ignore' });
    console.log(`✓ Created: ${vid.file}`);
  } catch (err) {
    console.error(`Failed to create ${vid.file}:`, err);
  }
}

console.log('All video clips generated successfully!');
