const git = require('isomorphic-git');
const fs = require('fs');
const path = require('path');
const http = require('isomorphic-git/http/node');

const dir = path.resolve(__dirname, '..');

async function main() {
  const action = process.argv[2] || 'status';

  if (action === 'status') {
    console.log('Checking status in:', dir);
    const matrix = await git.statusMatrix({ fs, dir });
    const changes = matrix.filter(row => {
      const [filepath, head, workdir, stage] = row;
      // Head !== Workdir means modified, added, or deleted
      return head !== workdir || workdir !== stage;
    });

    if (changes.length === 0) {
      console.log('No changes detected.');
      return;
    }

    console.log('\nChanges:');
    changes.forEach(row => {
      const [filepath, head, workdir, stage] = row;
      let statusText = 'unknown';
      if (head === 1 && workdir === 2) statusText = 'modified';
      else if (head === 0 && workdir === 2) statusText = 'added';
      else if (head === 1 && workdir === 0) statusText = 'deleted';
      
      console.log(`  ${statusText.toUpperCase()}: ${filepath}`);
    });
  } else if (action === 'commit') {
    const msg = process.argv[3] || 'update: sync latest features and updates';
    console.log('Staging all changes...');
    const matrix = await git.statusMatrix({ fs, dir });
    for (const row of matrix) {
      const [filepath, head, workdir, stage] = row;
      if (head !== workdir || workdir !== stage) {
        if (workdir === 0) {
          // File deleted
          await git.remove({ fs, dir, filepath });
          console.log(`Removed: ${filepath}`);
        } else {
          // File added/modified
          await git.add({ fs, dir, filepath });
          console.log(`Staged: ${filepath}`);
        }
      }
    }

    console.log('Committing with message:', msg);
    const sha = await git.commit({
      fs,
      dir,
      author: {
        name: 'NEXUS Project',
        email: 'nexus@project.local',
      },
      message: msg,
    });
    console.log(`Committed successfully. SHA: ${sha}`);
  } else if (action === 'push') {
    console.log('Pushing to remote origin...');
    
    // Read remote config to get token/url
    const config = fs.readFileSync(path.join(dir, '.git/config'), 'utf8');
    const remoteMatch = config.match(/url\s*=\s*(https:\/\/([^@]+)@github\.com\/[^\s]+)/);
    
    if (!remoteMatch) {
      console.error('Could not find remote url with token in .git/config');
      process.exit(1);
    }
    
    const currentBranch = await git.currentBranch({ fs, dir }) || 'master';
    console.log(`Current branch is '${currentBranch}'. Executing push...`);

    const result = await git.push({
      fs,
      http,
      dir,
      remote: 'origin',
      ref: currentBranch,
      onAuth: () => ({ username: token, password: '' }),
    });
    
    console.log('Push result:', result);
    if (result.ok) {
      console.log('Push completed successfully! ✅');
    } else {
      console.error('Push failed:', result);
    }
  }
}

main().catch(err => {
  console.error('Error running git helper:', err);
  process.exit(1);
});
