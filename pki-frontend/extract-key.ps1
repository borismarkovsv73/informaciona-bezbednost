# PowerShell script to extract private key from PKCS12
Add-Type -AssemblyName System.Security

# Load the PKCS12 certificate
$p12Path = ".\certs\localhost.p12"
$password = "keystorePassword123"
$cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($p12Path, $password, [System.Security.Cryptography.X509Certificates.X509KeyStorageFlags]::Exportable)

# Extract private key in PEM format
$privateKey = $cert.PrivateKey
$privateKeyBytes = $privateKey.ExportPkcs8PrivateKey()
$privateKeyPem = [Convert]::ToBase64String($privateKeyBytes, [Base64FormattingOptions]::InsertLineBreaks)

# Create PEM formatted private key
$pemContent = @"
-----BEGIN PRIVATE KEY-----
$privateKeyPem
-----END PRIVATE KEY-----
"@

# Save to file
$pemContent | Out-File -FilePath ".\certs\localhost.key" -Encoding utf8

Write-Host "Private key exported to certs\localhost.key"