@echo off
setlocal
cd /d "%~dp0backend"
npx tsx src/cli/seed-cli.ts %*
