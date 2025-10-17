type CommandItem = {
  category: string;
  cmd: string;
  desc: string;
};

export const ubuntuCommands: CommandItem[] = [
  { category: 'Ubuntu', cmd: 'sudo apt update', desc: 'Update package lists' },
  { category: 'Ubuntu', cmd: 'sudo apt upgrade', desc: 'Upgrade installed packages' },
  { category: 'Ubuntu', cmd: 'ls -la', desc: 'List files with details' },
  { category: 'Ubuntu', cmd: 'cd /path/to/dir', desc: 'Change directory' },
  { category: 'Ubuntu', cmd: 'rm -rf folder', desc: 'Force remove a folder recursively' },
  { category: 'Ubuntu', cmd: 'cp file1 file2', desc: 'Copy file1 to file2' },
  {
    category: 'Ubuntu',
    cmd: 'sudo kill -9 $(sudo lsof -t -i:<port_number>)',
    desc: 'Kill a process running on a specific port',
  },
];

export const gitCommands: CommandItem[] = [
  { category: 'Git', cmd: 'git init', desc: 'Initialize a new Git repository' },
  { category: 'Git', cmd: 'git clone <repo-url>', desc: 'Clone a repository' },
  { category: 'Git', cmd: 'git status', desc: 'Show working tree status' },
  { category: 'Git', cmd: 'git add .', desc: 'Stage all changes' },
  { category: 'Git', cmd: 'git commit -m "message"', desc: 'Commit staged changes' },
  { category: 'Git', cmd: 'git push', desc: 'Push commits to remote' },
  { category: 'Git', cmd: 'git pull', desc: 'Fetch and merge changes from remote' },
  { category: 'Git', cmd: 'git fetch', desc: 'Download objects and refs from another repository' },
  { category: 'Git', cmd: 'git branch', desc: 'List all local branches' },
  { category: 'Git', cmd: 'git checkout <branch>', desc: 'Switch branches' },
  { category: 'Git', cmd: 'git checkout -b <branch>', desc: 'Create and switch to a new branch' },
  { category: 'Git', cmd: 'git merge <branch>', desc: 'Merge another branch into current one' },
  { category: 'Git', cmd: 'git reset --hard HEAD~1', desc: 'Undo last commit completely' },
  { category: 'Git', cmd: 'git rebase <branch>', desc: 'Reapply commits on top of another branch' },
  {
    category: 'Git',
    cmd: 'git cherry-pick <commit>',
    desc: 'Apply a specific commit to current branch',
  },
  { category: 'Git', cmd: 'git log', desc: 'Show commit history' },
  { category: 'Git', cmd: 'git stash', desc: 'Stash uncommitted changes' },
  { category: 'Git', cmd: 'git stash apply', desc: 'Reapply stashed changes' },
  { category: 'Git', cmd: 'git diff', desc: 'Show changes between commits or working directory' },
  { category: 'Git', cmd: 'git remote -v', desc: 'Show remote repository URLs' },
  { category: 'Git', cmd: 'git tag', desc: 'List or create tags' },
  { category: 'Git', cmd: 'git clean -fd', desc: 'Remove untracked files and directories' },
  { category: 'Git', cmd: 'git rm <file>', desc: 'Remove file from repository and working tree' },
  { category: 'Git', cmd: 'git mv <old> <new>', desc: 'Rename or move a file' },
  { category: 'Git', cmd: 'git show <commit>', desc: 'Show details of a commit' },
  { category: 'Git', cmd: 'git blame <file>', desc: 'Show who last modified each line' },
  { category: 'Git', cmd: 'git reflog', desc: 'Show history of branch movements' },
  { category: 'Git', cmd: 'git config --list', desc: 'List all configuration settings' },
  { category: 'Git', cmd: 'git config --global user.name', desc: 'Show global Git username' },
  { category: 'Git', cmd: 'git config user.name', desc: 'Show local Git username' },
  {
    category: 'Git',
    cmd: 'git config credential.helper store',
    desc: 'Store credentials for future Git operations',
  },
  { category: 'Git', cmd: 'git credential-cache exit', desc: 'Clear the entire credential cache' },
];

export const dockerCommands: CommandItem[] = [
  { category: 'Docker', cmd: 'docker ps', desc: 'List running containers' },
  { category: 'Docker', cmd: 'docker ps -a', desc: 'List all containers (including stopped)' },
  { category: 'Docker', cmd: 'docker images', desc: 'List local Docker images' },
  { category: 'Docker', cmd: 'docker pull <image>', desc: 'Pull image from Docker Hub' },
  { category: 'Docker', cmd: 'docker run -d <image>', desc: 'Run container in detached mode' },
  { category: 'Docker', cmd: 'docker stop <container>', desc: 'Stop a running container' },
  { category: 'Docker', cmd: 'docker rm <container>', desc: 'Remove a stopped container' },
  { category: 'Docker', cmd: 'docker rmi <image>', desc: 'Remove an image' },
  {
    category: 'Docker',
    cmd: 'docker exec -it <container> bash',
    desc: 'Run bash inside container',
  },
  {
    category: 'Docker',
    cmd: 'docker cp <src> <container>:<dest>',
    desc: 'Copy files into a container',
  },
  {
    category: 'Docker',
    cmd: 'docker system prune',
    desc: 'Remove all unused containers, networks, and images',
  },
];
