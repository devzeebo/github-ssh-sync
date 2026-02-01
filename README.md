# GitHub SSH Key Sync

Syncs GitHub public SSH keys to Linux user `authorized_keys` files. Runs as a systemd timer every minute.

Each user who wants their GitHub keys synced creates their own config file at `~/.config/github-ssh-sync/config.json`.

## Installation (Arch Linux)

```bash
cd /path/to/github-ssh-sync
makepkg -si
```

## User Configuration

Each user creates their own config:

```bash
mkdir -p ~/.config/github-ssh-sync
cp /usr/share/github-ssh-sync/config.example.json ~/.config/github-ssh-sync/config.json
```

Edit `~/.config/github-ssh-sync/config.json`:

```json
{
  "github_username": "your-github-username"
}
```

## Enable the Timer

```bash
sudo systemctl enable --now github-ssh-sync.timer
```

## Manual Run

```bash
sudo systemctl start github-ssh-sync.service
```

## Logs

```bash
journalctl -u github-ssh-sync.service -f
```
