const { execSync } = require('child_process');

try {
  console.log('Running git add...');
  execSync('git add -A', { stdio: 'inherit' });

  console.log('Running git commit...');
  execSync('git commit -m "feat: PCホイール拡大縮小を5段階ステップ制御に変更し1段階ごとにカチッと止まるよう改善"', { stdio: 'inherit' });

  console.log('Running git push...');
  execSync('git push origin main', { stdio: 'inherit' });

  console.log('Push completed successfully!');
} catch (e) {
  console.error('Error during git operation:', e);
  process.exit(1);
}
