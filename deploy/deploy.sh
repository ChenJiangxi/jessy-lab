#!/usr/bin/env bash
# Run on the server as root: pull main, install, build, restart.
#   ssh root@8.216.48.63 'bash /home/jessy/personal-site/deploy/deploy.sh'
# The app reads dist/ at startup, so a build without a restart changes nothing.
set -euo pipefail
cd /home/jessy/personal-site
sudo -u jessy git pull --ff-only
sudo -u jessy pnpm install --frozen-lockfile
sudo -u jessy pnpm build
if ! cmp -s deploy/jessy-lab.service /etc/systemd/system/jessy-lab.service; then
  cp deploy/jessy-lab.service /etc/systemd/system/jessy-lab.service
  systemctl daemon-reload
fi
systemctl restart jessy-lab
for i in $(seq 1 20); do
  if curl -fsS -o /dev/null http://127.0.0.1:5173/; then
    echo "jessy-lab up after ${i}s"
    exit 0
  fi
  sleep 1
done
echo "jessy-lab did not come up — journalctl -u jessy-lab -n 50" >&2
exit 1
