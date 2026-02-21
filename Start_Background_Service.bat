@echo off
echo Starting AI Safe Network Backend in Background...
cd backend
npx pm2 start dist/server.js --name "ai-safe-network"
echo.
echo Backend is now running in the background! 
echo Alerts will pop up on your desktop even if this window is closed.
echo.
echo To stop: npx pm2 stop ai-safe-network
echo To see logs: npx pm2 logs
pause
