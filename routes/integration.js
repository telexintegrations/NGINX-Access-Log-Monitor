const express = require("express");
const router = express.Router();

router.get("/integration.json", (req, res) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;

  const integrationJson = {
    data: {
      date: { created_at: "2025-02-21", updated_at: "2025-02-22" },
      descriptions: {
        app_name: "NGINX Access Log Monitor",
        app_description: "Monitors NGINX access logs and sends alerts.",
        app_logo:
          "https://img.icons8.com/?size=100&id=MGa3MFjVDCLA&format=png&color=000000",
        app_url: baseUrl,
        background_color: "#fff",
      },
      is_active: false,
      integration_type: "interval",
      key_features: ["- Monitors NGINX access logs"],
      integration_category: "Monitoring & Logging",
      author: "Christian Umoh",
      website: baseUrl,
      settings: [
        {
          label: "ssh_host",
          type: "text",
          description: "The hostname or IP address of the NGINX server.",
          default: "",
          required: true,
        },
        {
          label: "ssh_port",
          type: "text",
          description: "The SSH port of the NGINX server (default: 22).",
          default: "22",
          required: true,
        },
        {
          label: "ssh_username",
          type: "text",
          description: "The SSH username for connecting to the NGINX server.",
          default: "root",
          required: true,
        },
        {
          label: "ssh_privateKey",
          type: "text",
          description:
            "The SSH private key for connecting to the NGINX server. Leave blank if using a password.",
          default: "",
          required: false,
        },
        {
          label: "ssh_password",
          type: "text",
          description:
            "The SSH password for connecting to the NGINX server. Leave blank if using a private key.",
          default: "",
          required: false,
        },
        {
          label: "log_path",
          type: "text",
          description: "The path to the NGINX access log file on the server.",
          default: "/var/log/nginx/access.log",
          required: true,
        },
        {
          label: "interval",
          type: "text",
          description:
            "Cron expression for how often to check logs (e.g., '* * * * *' for every minute). Handled by the platform.",
          default: "* * * * *",
          required: true,
        },
      ],
      target_url: "",
      tick_url: `${baseUrl}/tick`,
    },
  };

  res.json(integrationJson);
});

module.exports = router;
