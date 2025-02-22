# Nginx Access Log Monitor

A Node.js integration that monitors Nginx access logs on a remote VPS via SSH, parses them, and sends the results to a Telex channel at a configurable interval (default: every 2 minutes). Deployable on Render, it supports starting and stopping the monitoring task dynamically.

## Features
- Fetches the last 100 lines of an Nginx access log via SSH.
- Parses logs and sends them to a Telegram channel.
- Runs continuously on a cron-based interval (e.g., every 2 minutes).
- Provides a `/stop` endpoint to halt monitoring for a specific channel.
- Supports multiple users with unique `channel_ids`.

## Prerequisites
- **Node.js**: v16 or higher.
- **NPM**: For installing dependencies.
- **Render Account**: For deployment (optional; can run locally).
- **Telex Channel**: A channel where the logs will be sent.
- **SSH Access**: A VPS with Nginx and an SSH private key (Ed25519 or RSA supported).

## Setup

### 1. Clone the Repository
```bash
git clone https://github.com/telexintegrations/NGINX-Access-Log-Monitor.git
```

### 2. Install Dependencies
```bash
npm install
```
This installs:
- **express**: Web server framework.
- **axios**: HTTP client for Telegram API calls.
- **node-cron**: Cron scheduling for interval-based tasks.
- **ssh2**: SSH client for log fetching.
- **cors**: Cross-origin resource sharing.

### 3. Configure Environment (Optional)
Create a `.env` file for sensitive settings (optional, as settings are passed via API):
```bash
PORT=8000
```
_Default port is 8000 if not specified._

### 4. Prepare SSH Access
Generate an SSH key pair if you don’t have one:
```bash
ssh-keygen -t ed25519 -C "your-email@example.com"
```
Add the public key to your VPS’s `~/.ssh/authorized_keys`.
Copy the private key content (e.g., from `~/.ssh/id_ed25519`) for use in requests.

## Usage

### API Endpoints

#### `GET /integration.json`
Returns metadata about the integration, including settings and `tick_url`.
```bash
curl http://localhost:8000/integration.json
```

#### `POST /tick`
Starts log monitoring for a given `channel_id` at the specified interval.

##### Request Body:
```json
{
  "channel_id": "<your-test-telex-channel-id>",
  "return_url": "https://ping.telex.im/v1/return/<your-test-telex-channel-id>",
  "settings": [
    {"label": "ssh_host", "value": "your.vps.ip"},
    {"label": "ssh_port", "value": "22"},
    {"label": "ssh_username", "value": "youruser"},
    {"label": "ssh_privateKey", "value": "-----BEGIN OPENSSH PRIVATE KEY-----b3BlbnNzaC1r...-----END OPENSSH PRIVATE KEY-----"},
    {"label": "log_path", "value": "/var/log/nginx/access.log"},
    {"label": "interval", "value": "*/2 * * * *"}
  ]
}
```
##### Response:
```json
{
  "status": "success",
  "message": "Log monitoring scheduled for channel_id: your-channel-id with interval: */2 * * * *"
}
```

#### `POST /stop`
Stops log monitoring for a given `channel_id`.

##### Request Body:
```json
{
  "channel_id": "your-channel-id"
}
```
##### Response:
```json
{
  "status": "success",
  "message": "Log monitoring stopped for channel_id: your-channel-id"
}
```

## Settings
- **ssh_host**: VPS IP or hostname (required).
- **ssh_port**: SSH port (default: 22, required).
- **ssh_username**: SSH username (required).
- **ssh_privateKey**: Full SSH private key content (required if no password).
- **ssh_password**: SSH password (required if no private key).
- **log_path**: Path to Nginx access log (default: `/var/log/nginx/access.log`, required).
- **interval**: Cron expression (e.g., `*/2 * * * *` for every 2 minutes, required).

## Formatting the SSH Private Key
The `ssh_privateKey` field must be a valid JSON string. Since private keys (e.g., RSA or Ed25519) are multi-line, you need to account for escape characters or convert them to a single line to avoid JSON parsing errors.

### Option 1: Single-Line Format
Remove all newlines from the key.
```json
{"label": "ssh_privateKey", "value": "-----BEGIN OPENSSH PRIVATE KEY-----b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAA...-----END OPENSSH PRIVATE KEY-----"}
```

### Option 2: Escaped Newlines
Keep newlines and escape them with `\n`.
```json
{"label": "ssh_privateKey", "value": "-----BEGIN OPENSSH PRIVATE KEY-----\nb3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAA...\n-----END OPENSSH PRIVATE KEY-----"}
```

## Testing Locally

### 1. Start the Server
```bash
node app.js
```
Server runs on `http://localhost:8000` (or your `PORT`).

### 2. Test `/integration.json`
```bash
curl http://localhost:8000/integration.json
```
Verify the response includes settings and `tick_url`.

### 3. Start Monitoring
```bash
curl -X POST http://localhost:8000/tick \
-H "Content-Type: application/json" \
-d '{
  "channel_id": "<your-test-telex-channel-id>",
  "return_url": "https://ping.telex.im/v1/return/<your-test-telex-channel-id>",
  "settings": [
    {"label": "ssh_host", "value": "your.vps.ip"},
    {"label": "ssh_port", "value": "22"},
    {"label": "ssh_username", "value": "youruser"},
    {"label": "log_path", "value": "/var/log/nginx/access.log"},
    {"label": "interval", "value": "*/2 * * * *"}
  ]
}'
```
Wait 2 minutes to see logs in the Telex channel.

### 4. Stop Monitoring
```bash
curl -X POST http://localhost:8000/stop \
-H "Content-Type: application/json" \
-d '{"channel_id": "<your-test-telex-channel-id>"}'
```

## Deployment on Render

### 1. Prepare for Deployment
Ensure your repo is on GitHub/GitLab/Bitbucket.

#### Procfile:
```text
web: node app.js
```

#### Update `package.json`:
```json
"scripts": {
  "start": "node app.js"
}
```

### 2. Deploy to Render
1. Go to **Render Dashboard**.
2. Click **New > Web Service** and connect your repo.
3. Configure:
   - Runtime: **Node.js**
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Deploy and get your Render URL.
4. Replace `http://localhost:8000` with your Render URL in test commands above.

---
