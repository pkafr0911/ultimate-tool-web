type CommandItem = {
  category: string;
  cmd: string;
  desc: string;
};

export const ubuntuCommands: CommandItem[] = [
  // Package management
  { category: 'Ubuntu', cmd: 'sudo apt update', desc: 'Update package lists' },
  { category: 'Ubuntu', cmd: 'sudo apt upgrade', desc: 'Upgrade installed packages' },
  {
    category: 'Ubuntu',
    cmd: 'sudo apt full-upgrade',
    desc: 'Upgrade packages, removing obsolete ones if needed',
  },
  { category: 'Ubuntu', cmd: 'sudo apt install <package>', desc: 'Install a package' },
  { category: 'Ubuntu', cmd: 'sudo apt remove <package>', desc: 'Remove a package (keep configs)' },
  {
    category: 'Ubuntu',
    cmd: 'sudo apt purge <package>',
    desc: 'Remove a package including configs',
  },
  { category: 'Ubuntu', cmd: 'sudo apt autoremove', desc: 'Remove unused dependencies' },
  { category: 'Ubuntu', cmd: 'apt search <keyword>', desc: 'Search for a package by keyword' },
  { category: 'Ubuntu', cmd: 'dpkg -l | grep <package>', desc: 'Check if a package is installed' },

  // File & directory navigation
  { category: 'Ubuntu', cmd: 'ls -la', desc: 'List files with details (including hidden)' },
  { category: 'Ubuntu', cmd: 'ls -lh', desc: 'List files with human-readable sizes' },
  { category: 'Ubuntu', cmd: 'cd /path/to/dir', desc: 'Change directory' },
  { category: 'Ubuntu', cmd: 'cd -', desc: 'Switch to previous directory' },
  { category: 'Ubuntu', cmd: 'pwd', desc: 'Print current working directory' },
  { category: 'Ubuntu', cmd: 'mkdir -p path/to/dir', desc: 'Create directory (including parents)' },
  { category: 'Ubuntu', cmd: 'tree -L 2', desc: 'Show directory tree up to 2 levels deep' },

  // Files
  { category: 'Ubuntu', cmd: 'rm -rf folder', desc: 'Force remove a folder recursively' },
  { category: 'Ubuntu', cmd: 'cp file1 file2', desc: 'Copy file1 to file2' },
  { category: 'Ubuntu', cmd: 'cp -r dir1 dir2', desc: 'Copy directory recursively' },
  { category: 'Ubuntu', cmd: 'mv src dest', desc: 'Move or rename a file/directory' },
  { category: 'Ubuntu', cmd: 'touch file.txt', desc: 'Create an empty file or update timestamp' },
  { category: 'Ubuntu', cmd: 'cat file.txt', desc: 'Print file contents' },
  { category: 'Ubuntu', cmd: 'less file.txt', desc: 'Page through a file (q to quit)' },
  { category: 'Ubuntu', cmd: 'head -n 20 file.txt', desc: 'Show the first 20 lines of a file' },
  { category: 'Ubuntu', cmd: 'tail -f /var/log/syslog', desc: 'Follow a log file in real time' },
  { category: 'Ubuntu', cmd: 'wc -l file.txt', desc: 'Count lines in a file' },
  { category: 'Ubuntu', cmd: 'find . -name "*.log"', desc: 'Find files by name pattern' },
  {
    category: 'Ubuntu',
    cmd: 'grep -rn "pattern" .',
    desc: 'Recursively search for a pattern with line numbers',
  },
  {
    category: 'Ubuntu',
    cmd: 'sed -i "s/old/new/g" file.txt',
    desc: 'In-place find and replace in a file',
  },
  {
    category: 'Ubuntu',
    cmd: 'awk "{print $1}" file.txt',
    desc: 'Print the first column of each line',
  },
  { category: 'Ubuntu', cmd: 'diff file1 file2', desc: 'Show differences between two files' },
  { category: 'Ubuntu', cmd: 'ln -s target link', desc: 'Create a symbolic link' },

  // Permissions & ownership
  { category: 'Ubuntu', cmd: 'chmod +x script.sh', desc: 'Make a file executable' },
  { category: 'Ubuntu', cmd: 'chmod 644 file', desc: 'Set file permissions to rw-r--r--' },
  { category: 'Ubuntu', cmd: 'chown user:group file', desc: 'Change file owner and group' },
  { category: 'Ubuntu', cmd: 'sudo !!', desc: 'Re-run the previous command as root' },

  // Archives & compression
  {
    category: 'Ubuntu',
    cmd: 'tar -czvf archive.tar.gz folder/',
    desc: 'Create a gzipped tar archive',
  },
  { category: 'Ubuntu', cmd: 'tar -xzvf archive.tar.gz', desc: 'Extract a gzipped tar archive' },
  { category: 'Ubuntu', cmd: 'zip -r archive.zip folder/', desc: 'Create a zip archive' },
  { category: 'Ubuntu', cmd: 'unzip archive.zip', desc: 'Extract a zip archive' },

  // Processes & system
  { category: 'Ubuntu', cmd: 'ps aux | grep <name>', desc: 'Find a running process by name' },
  { category: 'Ubuntu', cmd: 'top', desc: 'Show live process and resource usage' },
  { category: 'Ubuntu', cmd: 'htop', desc: 'Interactive process viewer (needs install)' },
  { category: 'Ubuntu', cmd: 'kill -9 <pid>', desc: 'Force kill a process by PID' },
  {
    category: 'Ubuntu',
    cmd: 'sudo kill -9 $(sudo lsof -t -i:<port_number>)',
    desc: 'Kill a process running on a specific port',
  },
  { category: 'Ubuntu', cmd: 'df -h', desc: 'Show disk space usage (human readable)' },
  { category: 'Ubuntu', cmd: 'du -sh *', desc: 'Show size of each item in the current folder' },
  { category: 'Ubuntu', cmd: 'free -h', desc: 'Show memory usage' },
  { category: 'Ubuntu', cmd: 'uname -a', desc: 'Show kernel and system info' },
  { category: 'Ubuntu', cmd: 'lsb_release -a', desc: 'Show Ubuntu distribution info' },
  { category: 'Ubuntu', cmd: 'uptime', desc: 'Show system uptime and load average' },
  {
    category: 'Ubuntu',
    cmd: 'sudo systemctl status <service>',
    desc: 'Show status of a systemd service',
  },
  {
    category: 'Ubuntu',
    cmd: 'sudo systemctl restart <service>',
    desc: 'Restart a systemd service',
  },
  {
    category: 'Ubuntu',
    cmd: 'sudo journalctl -u <service> -f',
    desc: 'Follow logs of a systemd service',
  },

  // Network
  { category: 'Ubuntu', cmd: 'ip a', desc: 'Show network interfaces and IP addresses' },
  { category: 'Ubuntu', cmd: 'ping -c 4 google.com', desc: 'Send 4 ICMP packets to a host' },
  {
    category: 'Ubuntu',
    cmd: 'curl -I https://example.com',
    desc: 'Fetch only HTTP headers from a URL',
  },
  { category: 'Ubuntu', cmd: 'wget <url>', desc: 'Download a file from the web' },
  { category: 'Ubuntu', cmd: 'ss -tulpn', desc: 'List open TCP/UDP ports and owning processes' },
  { category: 'Ubuntu', cmd: 'sudo lsof -i :<port>', desc: 'Show process listening on a port' },
  {
    category: 'Ubuntu',
    cmd: 'scp file user@host:/path',
    desc: 'Copy a file to a remote host over SSH',
  },
  { category: 'Ubuntu', cmd: 'ssh user@host', desc: 'Connect to a remote host over SSH' },

  // Shortcuts
  {
    category: 'Ubuntu',
    cmd: 'history | grep <keyword>',
    desc: 'Search shell history for a keyword',
  },
  { category: 'Ubuntu', cmd: 'echo $PATH', desc: 'Print the PATH environment variable' },
  { category: 'Ubuntu', cmd: 'which <cmd>', desc: 'Show path of an executable' },
  { category: 'Ubuntu', cmd: 'alias ll="ls -lah"', desc: 'Create a shell alias for this session' },
  { category: 'Ubuntu', cmd: 'source ~/.bashrc', desc: 'Reload the current shell configuration' },
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
  {
    category: 'Git',
    cmd: 'git remote set-url origin <NEW_GIT_URL_HERE>',
    desc: 'Change the remote repository URL. See "git help remote" or edit .git/config manually.',
  },
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
  { category: 'Git', cmd: 'git restore <file>', desc: 'Discard changes in the working directory' },
  {
    category: 'Git',
    cmd: 'git restore --staged <file>',
    desc: 'Unstage a file (keep working changes)',
  },
  {
    category: 'Git',
    cmd: 'git reset --soft HEAD~1',
    desc: 'Undo last commit but keep changes staged',
  },
  { category: 'Git', cmd: 'git reset HEAD~1', desc: 'Undo last commit, keep changes unstaged' },
  { category: 'Git', cmd: 'git revert <commit>', desc: 'Create a new commit that undoes a commit' },
  {
    category: 'Git',
    cmd: 'git log --oneline --graph --all',
    desc: 'Compact graph view of all branches',
  },
  { category: 'Git', cmd: 'git log -p <file>', desc: 'Show commit history with diffs for a file' },
  { category: 'Git', cmd: 'git shortlog -sn', desc: 'Summary of commits per contributor' },
  { category: 'Git', cmd: 'git branch -d <branch>', desc: 'Delete a merged local branch' },
  { category: 'Git', cmd: 'git branch -D <branch>', desc: 'Force delete a local branch' },
  { category: 'Git', cmd: 'git push origin --delete <branch>', desc: 'Delete a remote branch' },
  {
    category: 'Git',
    cmd: 'git push -u origin <branch>',
    desc: 'Push and set upstream for a new branch',
  },
  {
    category: 'Git',
    cmd: 'git push --force-with-lease',
    desc: 'Safer force push (respects upstream changes)',
  },
  {
    category: 'Git',
    cmd: 'git pull --rebase',
    desc: 'Fetch and rebase local commits on top of remote',
  },
  { category: 'Git', cmd: 'git stash pop', desc: 'Apply latest stash and remove it' },
  { category: 'Git', cmd: 'git stash list', desc: 'List all stashed changes' },
  { category: 'Git', cmd: 'git stash drop', desc: 'Delete the latest stash' },
  { category: 'Git', cmd: 'git diff --staged', desc: 'Show diff of staged (indexed) changes' },
  { category: 'Git', cmd: 'git diff <branch1>..<branch2>', desc: 'Show diff between two branches' },
  {
    category: 'Git',
    cmd: 'git commit --amend',
    desc: 'Amend the previous commit (message or files)',
  },
  {
    category: 'Git',
    cmd: 'git commit --amend --no-edit',
    desc: 'Amend previous commit without changing message',
  },
  { category: 'Git', cmd: 'git rebase -i HEAD~3', desc: 'Interactive rebase of last 3 commits' },
  { category: 'Git', cmd: 'git rebase --abort', desc: 'Abort an in-progress rebase' },
  {
    category: 'Git',
    cmd: 'git rebase --continue',
    desc: 'Continue a rebase after resolving conflicts',
  },
  { category: 'Git', cmd: 'git merge --abort', desc: 'Abort a merge in progress' },
  {
    category: 'Git',
    cmd: 'git fetch --prune',
    desc: 'Fetch and remove stale remote-tracking branches',
  },
  { category: 'Git', cmd: 'git switch <branch>', desc: 'Switch to an existing branch (modern)' },
  {
    category: 'Git',
    cmd: 'git switch -c <branch>',
    desc: 'Create and switch to a new branch (modern)',
  },
  {
    category: 'Git',
    cmd: 'git worktree add ../wt <branch>',
    desc: 'Check out a branch into a linked working tree',
  },
  { category: 'Git', cmd: 'git bisect start', desc: 'Start a binary search for a bad commit' },
  {
    category: 'Git',
    cmd: 'git config --global user.email "you@example.com"',
    desc: 'Set global Git email',
  },
  {
    category: 'Git',
    cmd: 'git config --global init.defaultBranch main',
    desc: 'Default new repos to "main" branch',
  },
  {
    category: 'Git',
    cmd: 'git archive -o out.zip HEAD',
    desc: 'Create a zip archive of the current tree',
  },
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
  {
    category: 'Docker',
    cmd: 'docker system prune -a --volumes',
    desc: 'Aggressively prune everything unused including volumes',
  },
  { category: 'Docker', cmd: 'docker volume ls', desc: 'List Docker volumes' },
  { category: 'Docker', cmd: 'docker volume rm <volume>', desc: 'Remove a volume' },
  { category: 'Docker', cmd: 'docker volume prune', desc: 'Remove all unused volumes' },
  { category: 'Docker', cmd: 'docker network ls', desc: 'List Docker networks' },
  {
    category: 'Docker',
    cmd: 'docker network create <name>',
    desc: 'Create a user-defined bridge network',
  },
  {
    category: 'Docker',
    cmd: 'docker network inspect <name>',
    desc: 'Show low-level info about a network',
  },
  { category: 'Docker', cmd: 'docker logs <container>', desc: 'Show container logs' },
  {
    category: 'Docker',
    cmd: 'docker logs -f --tail 100 <container>',
    desc: 'Follow last 100 lines of container logs',
  },
  {
    category: 'Docker',
    cmd: 'docker inspect <container>',
    desc: 'Show low-level info about a container',
  },
  {
    category: 'Docker',
    cmd: 'docker stats',
    desc: 'Live CPU/memory/network stats for running containers',
  },
  {
    category: 'Docker',
    cmd: 'docker top <container>',
    desc: 'Show running processes in a container',
  },
  { category: 'Docker', cmd: 'docker restart <container>', desc: 'Restart a running container' },
  { category: 'Docker', cmd: 'docker start <container>', desc: 'Start a stopped container' },
  { category: 'Docker', cmd: 'docker kill <container>', desc: 'Send SIGKILL to a container' },
  { category: 'Docker', cmd: 'docker rename <old> <new>', desc: 'Rename a container' },
  {
    category: 'Docker',
    cmd: 'docker run --rm -it -p 8080:80 <image>',
    desc: 'Run an interactive container with port mapping (remove on exit)',
  },
  {
    category: 'Docker',
    cmd: 'docker run -v $(pwd):/app -w /app <image>',
    desc: 'Mount current directory into /app and set as workdir',
  },
  {
    category: 'Docker',
    cmd: 'docker build -t <name>:<tag> .',
    desc: 'Build an image from the current directory',
  },
  {
    category: 'Docker',
    cmd: 'docker build --no-cache -t <name> .',
    desc: 'Build image ignoring the cache',
  },
  {
    category: 'Docker',
    cmd: 'docker tag <src> <registry>/<name>:<tag>',
    desc: 'Tag an image for a registry',
  },
  {
    category: 'Docker',
    cmd: 'docker push <registry>/<name>:<tag>',
    desc: 'Push an image to a registry',
  },
  { category: 'Docker', cmd: 'docker login <registry>', desc: 'Log in to a Docker registry' },
  { category: 'Docker', cmd: 'docker image prune -a', desc: 'Remove all unused images' },
  {
    category: 'Docker',
    cmd: 'docker rm -f $(docker ps -aq)',
    desc: 'Force-remove ALL containers (use with care)',
  },
  {
    category: 'Docker',
    cmd: 'docker rmi $(docker images -q)',
    desc: 'Remove ALL images (use with care)',
  },
  {
    category: 'Docker',
    cmd: 'docker compose up -d',
    desc: 'Start services defined in docker-compose.yml in background',
  },
  {
    category: 'Docker',
    cmd: 'docker compose down',
    desc: 'Stop and remove containers from compose project',
  },
  {
    category: 'Docker',
    cmd: 'docker compose logs -f <service>',
    desc: 'Follow logs from a compose service',
  },
  { category: 'Docker', cmd: 'docker compose build', desc: 'Build or rebuild compose services' },
  {
    category: 'Docker',
    cmd: 'docker compose ps',
    desc: 'List containers for the current compose project',
  },
  {
    category: 'Docker',
    cmd: 'docker compose exec <service> sh',
    desc: 'Open a shell in a running compose service',
  },
  { category: 'Docker', cmd: 'docker version', desc: 'Show Docker client and server versions' },
  { category: 'Docker', cmd: 'docker info', desc: 'Show system-wide Docker information' },
];

export const kubernetesCommands: CommandItem[] = [
  // Context & config
  {
    category: 'Kubernetes',
    cmd: 'kubectl config get-contexts',
    desc: 'List available kubeconfig contexts',
  },
  {
    category: 'Kubernetes',
    cmd: 'kubectl config use-context <name>',
    desc: 'Switch the active kubeconfig context',
  },
  {
    category: 'Kubernetes',
    cmd: 'kubectl config current-context',
    desc: 'Show the current context',
  },
  {
    category: 'Kubernetes',
    cmd: 'kubectl cluster-info',
    desc: 'Show cluster endpoint and core services',
  },

  // Resource inspection
  { category: 'Kubernetes', cmd: 'kubectl get pods -A', desc: 'List pods across all namespaces' },
  {
    category: 'Kubernetes',
    cmd: 'kubectl get pods -n <ns> -o wide',
    desc: 'List pods in a namespace with node & IP info',
  },
  {
    category: 'Kubernetes',
    cmd: 'kubectl get svc,ingress,deploy -n <ns>',
    desc: 'Show services, ingresses, and deployments',
  },
  {
    category: 'Kubernetes',
    cmd: 'kubectl describe pod <pod> -n <ns>',
    desc: 'Show detailed info and events for a pod',
  },
  {
    category: 'Kubernetes',
    cmd: 'kubectl get events -n <ns> --sort-by=.lastTimestamp',
    desc: 'List recent events sorted by time',
  },
  {
    category: 'Kubernetes',
    cmd: 'kubectl top pods -n <ns>',
    desc: 'Show pod CPU/memory usage (metrics-server required)',
  },

  // Logs & exec
  { category: 'Kubernetes', cmd: 'kubectl logs <pod> -n <ns>', desc: 'Print logs from a pod' },
  {
    category: 'Kubernetes',
    cmd: 'kubectl logs -f <pod> -c <container> -n <ns>',
    desc: 'Follow logs of a specific container',
  },
  {
    category: 'Kubernetes',
    cmd: 'kubectl logs --previous <pod> -n <ns>',
    desc: 'Show logs from previous (crashed) container',
  },
  {
    category: 'Kubernetes',
    cmd: 'kubectl exec -it <pod> -n <ns> -- sh',
    desc: 'Open a shell inside a pod',
  },
  {
    category: 'Kubernetes',
    cmd: 'kubectl port-forward svc/<svc> 8080:80 -n <ns>',
    desc: 'Forward local port to a service',
  },
  {
    category: 'Kubernetes',
    cmd: 'kubectl cp <pod>:/path ./local -n <ns>',
    desc: 'Copy a file from a pod to local machine',
  },

  // Apply & delete
  {
    category: 'Kubernetes',
    cmd: 'kubectl apply -f manifest.yaml',
    desc: 'Apply a manifest (create/update resources)',
  },
  {
    category: 'Kubernetes',
    cmd: 'kubectl apply -k ./overlays/prod',
    desc: 'Apply a Kustomize overlay',
  },
  {
    category: 'Kubernetes',
    cmd: 'kubectl delete -f manifest.yaml',
    desc: 'Delete resources defined in a manifest',
  },
  {
    category: 'Kubernetes',
    cmd: 'kubectl delete pod <pod> -n <ns>',
    desc: 'Delete a pod (will be recreated by controller)',
  },

  // Scaling & rollouts
  {
    category: 'Kubernetes',
    cmd: 'kubectl scale deploy <name> --replicas=3 -n <ns>',
    desc: 'Scale a deployment to 3 replicas',
  },
  {
    category: 'Kubernetes',
    cmd: 'kubectl rollout status deploy/<name> -n <ns>',
    desc: 'Watch rollout status of a deployment',
  },
  {
    category: 'Kubernetes',
    cmd: 'kubectl rollout restart deploy/<name> -n <ns>',
    desc: 'Trigger a rolling restart of a deployment',
  },
  {
    category: 'Kubernetes',
    cmd: 'kubectl rollout undo deploy/<name> -n <ns>',
    desc: 'Roll back a deployment to the previous revision',
  },

  // Namespaces & secrets
  { category: 'Kubernetes', cmd: 'kubectl create ns <name>', desc: 'Create a namespace' },
  { category: 'Kubernetes', cmd: 'kubectl get ns', desc: 'List namespaces' },
  {
    category: 'Kubernetes',
    cmd: 'kubectl create secret generic <name> --from-literal=key=value -n <ns>',
    desc: 'Create a generic secret from literal values',
  },
  {
    category: 'Kubernetes',
    cmd: 'kubectl get secret <name> -n <ns> -o jsonpath="{.data.key}" | base64 -d',
    desc: 'Decode a key from a Kubernetes secret',
  },
];

export const npmCommands: CommandItem[] = [
  // Init & install
  { category: 'npm', cmd: 'npm init -y', desc: 'Initialize a new package.json with defaults' },
  { category: 'npm', cmd: 'npm install', desc: 'Install all dependencies from package.json' },
  { category: 'npm', cmd: 'npm install <pkg>', desc: 'Add a runtime dependency' },
  { category: 'npm', cmd: 'npm install -D <pkg>', desc: 'Add a dev dependency' },
  { category: 'npm', cmd: 'npm install -g <pkg>', desc: 'Install a package globally' },
  { category: 'npm', cmd: 'npm uninstall <pkg>', desc: 'Remove a package from dependencies' },
  { category: 'npm', cmd: 'npm ci', desc: 'Clean install using package-lock.json (CI-friendly)' },

  // Scripts & updates
  { category: 'npm', cmd: 'npm run <script>', desc: 'Run a script defined in package.json' },
  { category: 'npm', cmd: 'npm test', desc: 'Run the "test" script' },
  {
    category: 'npm',
    cmd: 'npm outdated',
    desc: 'List packages that have newer versions available',
  },
  { category: 'npm', cmd: 'npm update', desc: 'Update packages within allowed semver ranges' },
  { category: 'npm', cmd: 'npm audit fix', desc: 'Automatically fix vulnerable dependencies' },
  { category: 'npm', cmd: 'npm dedupe', desc: 'Simplify the dependency tree by deduping packages' },

  // Info
  { category: 'npm', cmd: 'npm list --depth=0', desc: 'List top-level installed packages' },
  {
    category: 'npm',
    cmd: 'npm view <pkg> versions --json',
    desc: 'Show all published versions of a package',
  },
  { category: 'npm', cmd: 'npm why <pkg>', desc: 'Explain why a package is installed' },
  { category: 'npm', cmd: 'npx <pkg>', desc: 'Run a package without installing it globally' },

  // Publishing
  { category: 'npm', cmd: 'npm login', desc: 'Authenticate with the npm registry' },
  { category: 'npm', cmd: 'npm version patch', desc: 'Bump patch version and create a git tag' },
  { category: 'npm', cmd: 'npm publish --access public', desc: 'Publish a package as public' },

  // Cache & cleanup
  { category: 'npm', cmd: 'npm cache clean --force', desc: 'Force clear the npm cache' },
  {
    category: 'npm',
    cmd: 'rm -rf node_modules package-lock.json && npm install',
    desc: 'Nuke dependencies and reinstall cleanly',
  },

  // pnpm / yarn equivalents
  {
    category: 'npm',
    cmd: 'pnpm install',
    desc: 'Install dependencies using pnpm (faster, disk-efficient)',
  },
  { category: 'npm', cmd: 'yarn add <pkg>', desc: 'Add a dependency using Yarn' },
];
