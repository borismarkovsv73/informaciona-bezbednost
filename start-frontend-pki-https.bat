@echo off
echo =====================================
echo Starting PKI Frontend (HTTPS Mode)
echo =====================================
echo.

cd /d "%~dp0pki-frontend"

echo Frontend will start on: https://localhost:3000
echo Backend HTTPS endpoint: https://localhost:8443
echo.
echo Using PKI-generated certificate for frontend HTTPS!
echo Certificate: localhost.p12 (from our own PKI)
echo.
echo Make sure backend is running first!
echo Login credentials: admin / admin123
echo.

echo Starting Next.js HTTPS development server...
npm run dev:pki

pause