const express = require("express");
const router = express.Router();
const axios = require("axios");
const cron = require("node-cron");
const logParser = require("../utils/logparser");

// Store schedules by channel_id to allow stopping them
const schedules = new Map();

router.post("/tick", async (req, res) => {
  const { channel_id, return_url, settings } = req.body;

  console.log("Received /tick request with payload:", req.body);

  if (!settings || !Array.isArray(settings)) {
    console.error("Invalid or missing settings");
    return res.status(400).json({
      status: "error",
      message: "Invalid or missing settings.",
    });
  }

  const sshConfig = {
    host: settings.find((s) => s.label === "ssh_host")?.value || settings.find((s) => s.label === "ssh_host")?.default,
    port: settings.find((s) => s.label === "ssh_port")?.value || settings.find((s) => s.label === "ssh_port")?.default || 22,
    username: settings.find((s) => s.label === "ssh_username")?.value || settings.find((s) => s.label === "ssh_username")?.default,
    password: settings.find((s) => s.label === "ssh_password")?.value || settings.find((s) => s.label === "ssh_password")?.default,
    privateKey: settings.find((s) => s.label === "ssh_privateKey")?.value || settings.find((s) => s.label === "ssh_privateKey")?.default,
    logPath: settings.find((s) => s.label === "log_path")?.value || settings.find((s) => s.label === "log_path")?.default,
  };

  const interval = settings.find((s) => s.label === "interval")?.value || settings.find((s) => s.label === "interval")?.default;

  // Validation (unchanged)
  if (!sshConfig.host || !sshConfig.username || !sshConfig.logPath) {
    console.error("Missing required SSH settings");
    return res.status(400).json({ status: "error", message: "Missing required SSH settings." });
  }
  if (!interval) {
    console.error("Missing interval setting");
    return res.status(400).json({ status: "error", message: "Interval setting is required." });
  }
  if (sshConfig.password && sshConfig.privateKey) {
    console.error("Both password and private key provided");
    return res.status(400).json({ status: "error", message: "Provide either a password or a private key, not both." });
  }
  if (!sshConfig.password && !sshConfig.privateKey) {
    console.error("Neither password nor private key provided");
    return res.status(400).json({ status: "error", message: "Provide either a password or a private key." });
  }
  if (sshConfig.privateKey && !sshConfig.privateKey.includes("-----BEGIN")) {
    console.error("Invalid private key format");
    return res.status(400).json({ status: "error", message: "Invalid SSH private key format." });
  }
  if (!cron.validate(interval)) {
    console.error("Invalid cron expression:", interval);
    return res.status(400).json({ status: "error", message: "Invalid cron expression." });
  }

  try {
    // Stop existing schedule for this channel_id if it exists
    if (schedules.has(channel_id)) {
      schedules.get(channel_id).destroy();
      console.log(`Stopped existing schedule for channel_id: ${channel_id}`);
    }

    // Schedule the new task
    const schedule = cron.schedule(interval, async () => {
      console.log(`Running monitorTask for channel_id: ${channel_id} at interval: ${interval}`);
      try {
        await monitorTask(sshConfig, return_url, channel_id);
        console.log("monitorTask executed successfully");
      } catch (error) {
        console.error("Scheduled monitorTask failed:", error.message);
      }
    });

    // Store the schedule
    schedules.set(channel_id, schedule);
    console.log(`Scheduled monitorTask for channel_id: ${channel_id} with interval: ${interval}`);

    res.status(200).json({
      status: "success",
      message: `Log monitoring scheduled for channel_id: ${channel_id} with interval: ${interval}`,
    });
  } catch (error) {
    console.error("Error scheduling monitorTask:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

router.post("/stop", (req, res) => {
  const { channel_id } = req.body;

  if (!channel_id) {
    console.error("Missing channel_id in /stop request");
    return res.status(400).json({ status: "error", message: "channel_id is required." });
  }

  if (schedules.has(channel_id)) {
    schedules.get(channel_id).destroy();
    schedules.delete(channel_id);
    console.log(`Stopped schedule for channel_id: ${channel_id}`);
    res.status(200).json({
      status: "success",
      message: `Log monitoring stopped for channel_id: ${channel_id}`,
    });
  } else {
    console.log(`No schedule found for channel_id: ${channel_id}`);
    res.status(404).json({
      status: "error",
      message: `No active schedule found for channel_id: ${channel_id}`,
    });
  }
});

async function monitorTask(sshConfig, returnUrl, channel_id) {
  try {
    console.log(`Starting monitorTask for channel_id: ${channel_id}`);

    const logData = await logParser.fetchLogs(sshConfig);
    console.log("Logs fetched:", logData);

    const logs = await logParser.parseLogs(logData);
    console.log("Logs parsed:", logs);

    const telexFormat = {
      chat_id: channel_id, // Use channel_id for Telegram
      text: logs.join("\n"),
      parse_mode: "Markdown", // Optional for formatting
    };

    console.log(`Sending to return_url: ${returnUrl}`);
    await axios.post(returnUrl, telexFormat, {
      headers: { "Content-Type": "application/json" },
    });

    console.log("Monitoring task completed successfully.");
  } catch (error) {
    console.error(`Error during monitoring task for channel_id: ${channel_id}:`, error.message);

    const errorFormat = {
      chat_id: channel_id,
      text: `Error: ${error.message}`,
      parse_mode: "Markdown",
    };

    await axios.post(returnUrl, errorFormat, {
      headers: { "Content-Type": "application/json" },
    });

    throw error;
  }
}

module.exports = router;
