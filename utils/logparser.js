const { Client } = require("ssh2");

const logParser = {
  fetchLogs: async (sshConfig) => {
    return new Promise((resolve, reject) => {
      const conn = new Client();
      let logData = "";

      let privateKeyContent = sshConfig.privateKey;
      if (
        privateKeyContent &&
        privateKeyContent.includes("OPENSSH PRIVATE KEY") &&
        !privateKeyContent.includes("\n")
      ) {
        privateKeyContent = privateKeyContent
          .replace(
            "-----BEGIN OPENSSH PRIVATE KEY-----",
            "-----BEGIN OPENSSH PRIVATE KEY-----\n"
          )
          .replace(
            "-----END OPENSSH PRIVATE KEY-----",
            "\n-----END OPENSSH PRIVATE KEY-----"
          )
          .replace(/(.{64})/g, "$1\n");
        console.log(
          "Reconstructed private key with newlines:",
          privateKeyContent
        );
      }

      conn
        .on("ready", () => {
          console.log("SSH connection established");
          conn.exec(`tail -n 100 ${sshConfig.logPath}`, (err, stream) => {
            if (err) {
              console.error("Error executing command:", err);
              return reject(err);
            }

            stream
              .on("data", (data) => (logData += data.toString()))
              .on("close", () => {
                console.log("SSH stream closed");
                conn.end();
                resolve(logData);
              })
              .on("error", (err) => {
                console.error("SSH stream error:", err);
                reject(err);
              });
          });
        })
        .on("error", (err) => {
          console.error("SSH connection error:", err.message, err.level);
          reject(new Error(`SSH connection failed: ${err.message}`));
        })
        .connect({
          host: sshConfig.host,
          port: sshConfig.port,
          username: sshConfig.username,
          password: sshConfig.password,
          privateKey: privateKeyContent || null,
        });
    });
  },

  parseLogs: (logData) => {
    try {
      return logData
        .split("\n")
        .filter((line) => line.trim() !== "")
        .map((line) => {
          const [ip, timestamp, method, url, protocol, status, size] =
            line.split(" ");
          return `${ip} - ${timestamp} "${method} ${url} ${protocol}" ${status} ${size}`;
        });
    } catch (error) {
      throw new Error(`Error parsing logs: ${error.message}`);
    }
  },
};

module.exports = logParser;
