@echo off
echo =====================================
echo Testing PKI HTTPS Setup
echo =====================================
echo.

echo Testing Frontend HTTPS (should use PKI certificate):
C:\Windows\System32\curl.exe -k -v -I https://localhost:3000 2>&1 | findstr /i "certificate\|ssl\|tls\|subject\|issuer"

echo.
echo Testing Backend HTTPS (uses PKI certificate):
C:\Windows\System32\curl.exe -k -v -I https://localhost:8443/api/certificates 2>&1 | findstr /i "certificate\|ssl\|tls\|subject\|issuer"

echo.
echo Now browse to https://localhost:3000 and check:
echo 1. Browser shows "Secure" or "Certificate" icon
echo 2. Click on certificate to see it's issued by your PKI
echo 3. Your own certificate authority is being used!
echo.
pause