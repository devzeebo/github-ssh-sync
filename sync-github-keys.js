#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const https = require("https");

function getHomeDir(linuxUser) {
  if (linuxUser === "root") {
    return "/root";
  }
  return path.join("/home", linuxUser);
}

function getConfigPath(linuxUser) {
  return path.join(
    getHomeDir(linuxUser),
    ".config",
    "github-ssh-sync",
    "config.json",
  );
}

function loadUserConfig(linuxUser) {
  const configPath = getConfigPath(linuxUser);
  if (!fs.existsSync(configPath)) {
    return null;
  }
  const configContent = fs.readFileSync(configPath, "utf8");
  return JSON.parse(configContent);
}

function getLinuxUsers() {
  const passwdContent = fs.readFileSync("/etc/passwd", "utf8");
  const users = [];

  for (const line of passwdContent.split("\n")) {
    const parts = line.split(":");
    if (parts.length < 6) continue;

    const username = parts[0];
    const uid = parseInt(parts[2], 10);
    const homeDir = parts[5];

    if (uid >= 1000 || username === "root") {
      if (homeDir && (homeDir.startsWith("/home/") || homeDir === "/root")) {
        users.push(username);
      }
    }
  }

  return users;
}

function fetchGitHubKeys(username) {
  return new Promise((resolve, reject) => {
    const url = `https://github.com/${username}.keys`;

    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(
            new Error(
              `Failed to fetch keys for ${username}: HTTP ${res.statusCode}`,
            ),
          );
          return;
        }

        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data.trim()));
      })
      .on("error", reject);
  });
}

function getAuthorizedKeysPath(linuxUser) {
  return path.join(getHomeDir(linuxUser), ".ssh", "authorized_keys");
}

function ensureSshDirectory(linuxUser) {
  const sshDir = path.dirname(getAuthorizedKeysPath(linuxUser));

  if (!fs.existsSync(sshDir)) {
    fs.mkdirSync(sshDir, { recursive: true, mode: 0o700 });
  }
}

async function syncKeys(githubUsername, linuxUser) {
  console.log(
    `Syncing keys for GitHub user '${githubUsername}' to Linux user '${linuxUser}'`,
  );

  const keys = await fetchGitHubKeys(githubUsername);

  if (!keys) {
    console.warn(`No keys found for GitHub user '${githubUsername}'`);
    return;
  }

  const keyLines = keys.split("\n").filter((line) => line.trim());
  const markedKeys = keyLines.map((key) => `${key} # github:${githubUsername}`);

  ensureSshDirectory(linuxUser);
  const authKeysPath = getAuthorizedKeysPath(linuxUser);

  let existingKeys = [];
  if (fs.existsSync(authKeysPath)) {
    existingKeys = fs
      .readFileSync(authKeysPath, "utf8")
      .split("\n")
      .filter(
        (line) => line.trim() && !line.includes(`# github:${githubUsername}`),
      );
  }

  const allKeys = [...existingKeys, ...markedKeys].join("\n") + "\n";

  fs.writeFileSync(authKeysPath, allKeys, { mode: 0o600 });
  console.log(
    `Successfully synced ${keyLines.length} key(s) for '${githubUsername}' to '${linuxUser}'`,
  );
}

async function main() {
  try {
    const linuxUsers = getLinuxUsers();
    let synced = 0;

    for (const linuxUser of linuxUsers) {
      const config = loadUserConfig(linuxUser);

      if (!config) {
        continue;
      }

      if (!config.github_username) {
        console.error(`Config for '${linuxUser}' missing github_username`);
        continue;
      }

      await syncKeys(config.github_username, linuxUser);
      synced++;
    }

    if (synced === 0) {
      console.log("No users with config found");
    } else {
      console.log(`Sync completed successfully for ${synced} user(s)`);
    }
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();
