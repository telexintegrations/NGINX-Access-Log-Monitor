Nginx Access Log Monitor
A Node.js integration that monitors Nginx access logs on a remote VPS via SSH, parses them, and sends the results to a Telex channel at a configurable interval (default: every 2 minutes). Deployable on Render, it supports starting and stopping the monitoring task dynamically.
Features
Fetches the last 100 lines of an Nginx access log via SSH.
Parses logs and sends them to a Telegram channel.
Runs continuously on a cron-based interval (e.g., every 2 minutes).
Provides a /stop endpoint to halt monitoring for a specific channel.
Supports multiple users with unique channel_ids.
Prerequisites
Node.js: v16 or higher.
NPM: For installing dependencies.
Render Account: For deployment (optional; can run locally).
Telex Channel: A channel where the logs will be sent to.
SSH Access: A VPS with Nginx and an SSH private key (Ed25519 or RSA supported).
Setup

1. Clone the Repository
   bash
   git clone https://github.com/telexintegrations/NGINX-Access-Log-Monitor.git
2. Install Dependencies
   bash
   npm install
   This installs:
   express: Web server framework.
   axios: HTTP client for Telegram API calls.
   node-cron: Cron scheduling for interval-based tasks.
   ssh2: SSH client for log fetching.
   cors: Cross-origin resource sharing.
3. Configure Environment (Optional)
   Create a .env file for sensitive settings (optional, as settings are passed via API):
   bash
   PORT=8000
   Default port is 8000 if not specified.
4. Prepare SSH Access
   Generate an SSH key pair if you don’t have one:
   bash
   ssh-keygen -t ed25519 -C "your-email@example.com"
   Add the public key to your VPS’s ~/.ssh/authorized*keys.
   Copy the private key content (e.g., from ~/.ssh/id_ed25519) for use in requests.
   Usage
   API Endpoints
   GET /integration.json:
   Returns metadata about the integration, including settings and tick_url.
   Example: http://localhost:6024/integration.json
   POST /tick:
   Starts log monitoring for a given channel_id at the specified interval.
   Body:
   json
   {
   "channel_id": "<your-test-telex-channel-id>",
   "return_url": "https://ping.telex.im/v1/return/<your-test-telex-channel-id>",
   "settings": [
   {"label": "ssh_host", "value": "your.vps.ip"},
   {"label": "ssh_port", "value": "22"},
   {"label": "ssh_username", "value": "youruser"},
   {"label": "ssh_privateKey", "value": "-----BEGIN OPENSSH PRIVATE KEY-----b3BlbnNzaC1r...-----END OPENSSH PRIVATE KEY-----"},
   {"label": "log_path", "value": "/var/log/nginx/access.log"},
   {"label": "interval", "value": "*/2 \* \* \* _"}
   ]
   }
   Response:
   json
   {
   "status": "success",
   "message": "Log monitoring scheduled for channel_id: your-channel-id with interval: _/2 _ \* \* _"
   }
   POST /stop:
   Stops log monitoring for a given channel*id.
   Body:
   json
   {
   "channel_id": "your-channel-id"
   }
   Response:
   json
   {
   "status": "success",
   "message": "Log monitoring stopped for channel_id: your-channel-id"
   }
   Settings
   ssh_host: VPS IP or hostname (required).
   ssh_port: SSH port (default: 22, required).
   ssh_username: SSH username (required).
   ssh_privateKey: Full SSH private key content (required if no password).
   ssh_password: SSH password (required if no private key).
   log_path: Path to Nginx access log (default: /var/log/nginx/access.log, required).
   interval: Cron expression (e.g., */2 \* \* \* \* for every 2 minutes, required).

   Formatting the SSH Private Key
   The ssh_privateKey field must be a valid JSON string. Since private keys (e.g., RSA or Ed25519) are multi-line, you need to account for escape characters or convert them to a single line to avoid JSON parsing errors. Here’s how:
   Option 1: Single-Line Format
   Remove all newlines from the key.
   Example key (shortened for brevity):
   -----BEGIN OPENSSH PRIVATE KEY-----b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAA...-----END OPENSSH PRIVATE KEY-----
   In JSON:
   json
   {"label": "ssh_privateKey", "value": "-----BEGIN OPENSSH PRIVATE KEY-----b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAA...-----END OPENSSH PRIVATE KEY-----"}
   How to Convert:
   Copy the key (e.g., cat ~/.ssh/id_ed25519).
   Use a text editor to remove all line breaks (e.g., replace \n with nothing).
   Option 2: Escaped Newlines
   Keep newlines and escape them with \\n.
   Example key:
   -----BEGIN OPENSSH PRIVATE KEY-----
   b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAA...
   -----END OPENSSH PRIVATE KEY-----
   In JSON:
   json
   {"label": "ssh_privateKey", "value": "-----BEGIN OPENSSH PRIVATE KEY-----\\nb3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAA...\\n-----END OPENSSH PRIVATE KEY-----"}
   How to Convert:
   Copy the key.
   In a text editor, replace each newline with \\n (e.g., use "Find: \n, Replace: \n").
   Important Notes
   No Unescaped Newlines: Raw newlines (\n) without \\n will cause a SyntaxError in JSON parsing.
   Tools: Use Postman’s “raw” JSON body or a JSON validator (e.g., jsonlint.com) to test your payload.
   Security: Send requests over HTTPS to protect the key in transit.

   Testing Locally

5. Start the Server
   bash
   node app.js
   Server runs on http://localhost:8000 (or your PORT).
6. Test /integration.json
   bash
   curl http://localhost:8000/integration.json
   Verify the response includes settings and tick_url.
7. Start Monitoring
   Use Postman or curl:
   bash
   curl -X POST http://localhost:8000/tick \
   -H "Content-Type: application/json" \
   -d '{
   "channel_id": "<your-test-telex-channel-id>",
   "return_url": ""https://ping.telex.im/v1/return/<your-test-telex-channel-id>",
   "settings": [
   {"label": "ssh_host", "value": "your.vps.ip"},
   {"label": "ssh_port", "value": "22"},
   {"label": "ssh_username", "value": "youruser"},
   {"label": "ssh_privateKey", "value": "-----BEGIN OPENSSH PRIVATE KEY-----b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZWQyNTUxOQAAACBw4SdkfZfUfXjmSpAUXrACWo/oGT2hMTOT2VdR59OB3gAAAKDN/itwzf4rcAAAAAtzc2gtZWQyNTUxOQAAACBw4SdkfZfUfXjmSpAUXrACWo/oGT2hMTOT2VdR59OB3gAAAECAPyxpVjfxGQiHmvmDu/2+EGd7KJmvry//5SDBdc2icHDhJ2R9l9R9eOZKkBResAJaj+gZPaExM5PZV1Hn04HeAAAAGGNhbm9ub25lQERFU0tUT1AtMUFBNlFLNwECAwQF-----END OPENSSH PRIVATE KEY-----"},
   {"label": "log_path", "value": "/var/log/nginx/access.log"},
   {"label": "interval", "value": "*/2 * * * *"}
   ]
   }'
   Wait 2 minutes (next even minute, e.g., 12:02) to see logs in Telex channel.
   Check console for Running monitorTask....
8. Stop Monitoring
   bash
   curl -X POST http://localhost:8000/stop \
   -H "Content-Type: application/json" \
   -d '{"channel_id": "<your-test-telex-channel-id>"}'
   Confirm logs stop appearing in Telex.
   Deployment on Render
9. Prepare for Deployment
   Ensure your repo is on GitHub/GitLab/Bitbucket.
   Add a Procfile:
   web: node app.js
   Update package.json with a start script (if not already present):
   json
   "scripts": {
   "start": "node app.js"
   }
10. Deploy to Render
    Create a New Web Service:
    Go to Render Dashboard.
    Click “New” > “Web Service” and connect your repo.
    Configure:
    Runtime: Node.js.
    Build Command: npm install.
    Start Command: npm start.
    Environment Variables (optional): Add PORT if needed (Render defaults to 10000).
    Deploy: Click “Create Web Service” and wait for the build.
    Get URL: Note your app’s URL (e.g., https://your-app.onrender.com).
11. Test on Render
    Replace http://localhost:8000 with your Render URL in the test commands above.
    Start monitoring with /tick and stop with /stop.
    Alternative: One-Time Run
    If you prefer the monitor to run once per request instead of continuously:
    Modify tick.js:
    Remove node-cron and the /stop endpoint.
    Update /tick to run monitorTask once:
    javascript
    router.post("/tick", async (req, res) => {
    // ... (validation code) ...
    try {
    await monitorTask(sshConfig, return_url, channel_id);
    res.status(200).json({
    status: "success",
    message: `Log monitoring completed for channel_id: ${channel_id}`,
    });
    } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
    }
    });
    Redeploy: Push the change and test with /tick—logs appear immediately, no interval.
    Troubleshooting
    No Logs in Telegram:
    Check Render logs (Logs tab) for errors (e.g.,SSH connection issues).
    Verify return_url and channel_id (e.g., @YourChannel or numeric ID).
    Continuous Running Won’t Stop:
    Use /stop with the correct channel_id.
    Redeploy to reset all schedules.
    SSH Errors:
    Ensure the private key matches the VPS’s authorized_keys.
    Test SSH manually: ssh -i <key-file> youruser@your.vps.ip.
    Contributing
    Feel free to fork, submit PRs, or report issues on the repo!
    License
    MIT License – feel free to use and modify as needed.
