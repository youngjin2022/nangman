const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json'));
Object.keys(pkg.dependencies || {}).forEach(k => {
  if (pkg.dependencies[k].startsWith('workspace:')) delete pkg.dependencies[k];
});
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log('workspace: deps removed');