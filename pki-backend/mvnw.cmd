@echo off
REM Download and setup Maven if not exists
set MAVEN_VERSION=3.9.6
set MAVEN_HOME=%~dp0.mvn\apache-maven-%MAVEN_VERSION%
set PATH=%MAVEN_HOME%\bin;%PATH%

if not exist "%MAVEN_HOME%" (
    echo Downloading Maven %MAVEN_VERSION%...
    mkdir .mvn 2>nul
    powershell -Command "Invoke-WebRequest -Uri 'https://archive.apache.org/dist/maven/maven-3/%MAVEN_VERSION%/binaries/apache-maven-%MAVEN_VERSION%-bin.zip' -OutFile '.mvn\maven.zip'"
    powershell -Command "Expand-Archive -Path '.mvn\maven.zip' -DestinationPath '.mvn' -Force"
    del .mvn\maven.zip
)

"%MAVEN_HOME%\bin\mvn.cmd" %*