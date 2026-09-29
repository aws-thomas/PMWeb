import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // next dev otherwise appends its own block to CLAUDE.md when it detects an
  // AI agent. That file is the project's standing context and is edited by
  // hand only.
  agentRules: false,
};

export default nextConfig;
