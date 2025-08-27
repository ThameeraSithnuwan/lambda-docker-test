// index.mjs
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";
import os from "os";

const execAsync = promisify(exec);

export async function handler(event) {
  try {
    const body =
      typeof event.body === "string" ? JSON.parse(event.body) : event.body;
    const {
      repo_url,
      liquibase_path,
      liquibase_envs,
      liquibase_exec_cmd,
      commit_id,
    } = body;
    // get npm cmd

    if (!repo_url || !liquibase_path || !liquibase_exec_cmd) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing required input(s)" }),
      };
    }

    const patToken = process.env.PAT_TOKEN;
    if (!patToken) {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "PAT_TOKEN not set in environment" }),
      };
    }

    // Add PAT into repo URL
    let authRepoUrl = repo_url;
    if (repo_url.startsWith("https://")) {
      const parts = repo_url.split("https://");
      authRepoUrl = `https://${patToken}@${parts[1]}`;
    }

    // Create temp dir
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "repo-"));

    // Serialize env variables
    const envVarsArg = JSON.stringify(liquibase_envs || {});

    // Deploy script path
    const deployScript = path.join(
      new URL(".", import.meta.url).pathname,
      "deploy.sh"
    );

    // Call deploy.sh with args
    const cmd = `bash ${deployScript} '${authRepoUrl}' '${liquibase_path}' '${envVarsArg}' '${liquibase_exec_cmd}' '${tmpDir}' '${
      commit_id || ""
    }'`;
    const { stdout, stderr } = await execAsync(cmd);

    return {
      statusCode: 200,
      body: JSON.stringify({ stdout, stderr }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message, stack: error.stack }),
    };
  }
}
