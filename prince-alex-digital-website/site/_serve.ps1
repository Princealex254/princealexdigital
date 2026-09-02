$ErrorActionPreference = 'Continue'
$root = 'C:\Users\Alex Senerwa\Desktop\prince-alex-digital-website\site'
$listener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Loopback, 8123)
$listener.Start()
$enc = [System.Text.Encoding]::UTF8
$mimeMap = @{
  '.html'='text/html; charset=utf-8'; '.css'='text/css; charset=utf-8'; '.js'='application/javascript';
  '.jpg'='image/jpeg'; '.jpeg'='image/jpeg'; '.png'='image/png'; '.svg'='image/svg+xml';
  '.ico'='image/x-icon'; '.txt'='text/plain'; '.xml'='application/xml';
  '.json'='application/json'; '.webmanifest'='application/manifest+json'
}
while ($true) {
  try {
    $client = $listener.AcceptTcpClient()
    $stream = $client.GetStream()
    $reader = New-Object System.IO.StreamReader($stream, $enc)
    $first = $reader.ReadLine()
    while (-not [string]::IsNullOrEmpty($reader.ReadLine())) { }
    if (-not $first) { $stream.Close(); $client.Close(); continue }
    $parts = $first -split ' '
    $method = $parts[0]
    $raw = $parts[1]
    $path = ($raw -split '\?')[0]
    $path = [System.Uri]::UnescapeDataString($path) -replace '/', '\'
    $file = Join-Path $root $path.TrimStart('\')
    if (Test-Path $file -PathType Leaf) {
      $bytes = [System.IO.File]::ReadAllBytes($file)
      $ext = [System.IO.Path]::GetExtension($file).ToLowerInvariant()
      if ($mimeMap.ContainsKey($ext)) { $mime = $mimeMap[$ext] } else { $mime = 'application/octet-stream' }
      $header = "HTTP/1.1 200 OK`r`nContent-Type: $mime`r`nContent-Length: $($bytes.Length)`r`nConnection: close`r`n`r`n"
    } else {
      $bytes = $enc.GetBytes('404 Not Found')
      $header = "HTTP/1.1 404 Not Found`r`nContent-Type: text/plain`r`nContent-Length: $($bytes.Length)`r`nConnection: close`r`n`r`n"
    }
    $hb = [System.Text.Encoding]::ASCII.GetBytes($header)
    $stream.Write($hb, 0, $hb.Length)
    if ($method -ne 'HEAD') { $stream.Write($bytes, 0, $bytes.Length) }
    $stream.Close()
    $client.Close()
  } catch { }
}
