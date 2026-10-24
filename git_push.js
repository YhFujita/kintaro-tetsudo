const { execSync } = require('child_process');

try {
  console.log('Running git add -A...');
  execSync('git add -A', { stdio: 'inherit' });

  console.log('Running git commit...');
  execSync('git commit -m "feat: 全ての漢字にふりがな（ルビ）を追加＆辞書・UI・マップの網羅的対応"', { stdio: 'inherit' });

  console.log('Running git push origin main...');
  execSync('git push origin main', { stdio: 'inherit' });

  console.log('Push complete!');
} catch (e) {
  console.error('Error during git operation:', e.message);
  process.exit(1);
}
