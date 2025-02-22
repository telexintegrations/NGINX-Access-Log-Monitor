const express = require("express");
const router = express.Router();
const axios = require("axios");
const cron = require("node-cron"); // Import node-cron
const logParser = require("../utils/logparser");

router.post("/tick", async (req, res) => {
  const { channel_id, return_url, settings } = req.body;

  // Validate settings
  if (!settings || !Array.isArray(settings)) {
    return res.status(400).json({
      status: "error",
      message: "Invalid or missing settings.",
    });
  }

  // Extract settings
  const sshConfig = {
    host:
      settings.find((s) => s.label === "ssh_host")?.value ||
      settings.find((s) => s.label === "ssh_host")?.default,
    port:
      settings.find((s) => s.label === "ssh_port")?.value ||
      settings.find((s) => s.label === "ssh_port")?.default ||
      22,
    username:
      settings.find((s) => s.label === "ssh_username")?.value ||
      settings.find((s) => s.label === "ssh_username")?.default,
    password:
      settings.find((s) => s.label === "ssh_password")?.value ||
      settings.find((s) => s.label === "ssh_password")?.default,
    privateKey:
      settings.find((s) => s.label === "ssh_privateKey")?.value ||
      settings.find((s) => s.label === "ssh_privateKey")?.default,
    logPath:
      settings.find((s) => s.label === "log_path")?.value ||
      settings.find((s) => s.label === "log_path")?.default,
  };

  const interval =
    settings.find((s) => s.label === "interval")?.value ||
    settings.find((s) => s.label === "interval")?.default;

  // Validate required fields
  if (!sshConfig.host || !sshConfig.username || !sshConfig.logPath) {
    return res.status(400).json({
      status: "error",
      message: "Missing required SSH settings (host, username, or log_path).",
    });
  }

  if (!interval) {
    return res.status(400).json({
      status: "error",
      message: "Interval setting is required.",
    });
  }

  // Validate SSH credentials
  if (sshConfig.password && sshConfig.privateKey) {
    return res.status(400).json({
      status: "error",
      message: "Please provide either a password or a private key, not both.",
    });
  }

  if (!sshConfig.password && !sshConfig.privateKey) {
    return res.status(400).json({
      status: "error",
      message: "Please provide either a password or a private key.",
    });
  }

  if (sshConfig.privateKey && !sshConfig.privateKey.includes("-----BEGIN")) {
    return res.status(400).json({
      status: "error",
      message:
        "Invalid SSH private key format. It should include '-----BEGIN'.",
    });
  }

  // Validate cron expression
  if (!cron.validate(interval)) {
    console.error("Invalid cron expression:", interval);
    return res.status(400).json({
      status: "error",
      message: "Invalid cron expression provided for interval.",
    });
  }

  try {
    // Schedule the monitorTask with node-cron
    cron.schedule(interval, async () => {
      try {
        await monitorTask(sshConfig, return_url);
      } catch (error) {
        console.error("Scheduled monitorTask failed:", error.message);
      }
    });

    // Respond immediately to confirm scheduling
    res.status(200).json({
      status: "success",
      message: `Log monitoring scheduled with interval: ${interval}`,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

async function monitorTask(sshConfig, returnUrl) {
  try {
    const logData = await logParser.fetchLogs(sshConfig);
    const logs = await logParser.parseLogs(logData);
    const telexFormat = {
      message: logs.join("\n"),
      username: "NGINXAccessLogMonitor",
      event_name: "Log Check",
      status: "success",
    };

    await axios.post(returnUrl, telexFormat, {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error during monitoring task:", error.message);

    const errorFormat = {
      message: `Error: ${error.message}`,
      username: "NGINXAccessLogMonitor",
      event_name: "Log Check",
      status: "error",
    };

    await axios.post(returnUrl, errorFormat, {
      headers: { "Content-Type": "application/json" },
    });

    throw error; // Re-throw for cron to log
  }
}

module.exports = router;
