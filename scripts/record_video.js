const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function generateVideo() {
  console.log('Iniciando grabación de video tutorial con Puppeteer...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--autoplay-policy=no-user-gesture-required'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  await page.goto('http://localhost:3300/tutorial.html', { waitUntil: 'networkidle0' });

  console.log('Página de tutorial cargada. Iniciando captura de stream de video...');

  // Start recording inside page context
  const videoBufferBase64 = await page.evaluate(async () => {
    return new Promise(async (resolve) => {
      const canvas = document.getElementById('videoCanvas');
      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 3000000
      });

      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(blob);
      };

      recorder.start();

      // Step through all 7 chapters with pedagogical pacing
      const chapterTimes = [0, 28, 53, 80, 100, 133, 153];
      const durationPerSceneMs = 8500; // 8.5s per scene showcase

      for (let i = 0; i < chapterTimes.length; i++) {
        seekTo(chapterTimes[i]);
        drawScene(chapterTimes[i]);
        updateUI();

        // Animate inside chapter
        const startScene = performance.now();
        while (performance.now() - startScene < durationPerSceneMs) {
          const elapsed = (performance.now() - startScene) / 1000;
          drawScene(chapterTimes[i] + elapsed * 2);
          updateUI();
          await new Promise(r => setTimeout(r, 33)); // ~30 fps
        }
      }

      recorder.stop();
    });
  });

  const outputPath = path.join(__dirname, '..', 'public', 'video_tutorial_qualitas.webm');
  fs.writeFileSync(outputPath, Buffer.from(videoBufferBase64, 'base64'));

  const stats = fs.statSync(outputPath);
  console.log(`¡Video tutorial generado con éxito!`);
  console.log(`Archivo: ${outputPath}`);
  console.log(`Tamaño: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

  await browser.close();
}

generateVideo().catch(err => {
  console.error('Error generando video:', err);
  process.exit(1);
});
