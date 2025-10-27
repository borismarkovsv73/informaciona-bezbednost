@echo off
echo =====================================
echo Starting PKI Backend (HTTPS Mode)
echo =====================================
echo.

echo Setting up Java 17 environment...
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.16.8-hotspot
set PATH=%JAVA_HOME%\bin;%PATH%

echo Verifying Java version...
java -version
echo.

echo Starting PKI Backend...
echo - HTTPS Port: 8443
echo - Certificate: PKI-generated (pki-server.p12)
echo - Admin Login: admin / admin123
echo.

cd /d "%~dp0pki-backend"

echo Building and starting application...
mvnw.cmd clean spring-boot:run

pause