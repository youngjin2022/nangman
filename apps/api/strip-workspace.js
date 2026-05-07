const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json'));

// dependencies에서 workspace: 제거
Object.keys(pkg.dependencies || {}).forEach(k => {
  if (String(pkg.dependencies[k]).startsWith('workspace:')) delete pkg.dependencies[k];
});

// devDependencies에서 workspace: 제거
Object.keys(pkg.devDependencies || {}).forEach(k => {
  if (String(pkg.devDependencies[k]).startsWith('workspace:')) delete pkg.devDependencies[k];
});

// pnpm workspace 설정 제거
delete pkg.pnpm;

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log('workspace: deps removed');