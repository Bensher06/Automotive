<#
Simple PowerShell static server for the workspace.
Usage: Right-click -> Run with PowerShell, or run from PowerShell:
  cd 'C:\SE code - EXPERIMENTAL'
  .\serve.ps1 -Port 8000

Notes:
- Binds to http://localhost:<Port>/ so no URL ACL is required.
- If you need to serve on a non-localhost hostname, you'll need to add a URL ACL or run as Administrator.
#>

param(
    [int]$Port = 8000
)

Add-Type -AssemblyName System.Net.HttpListener
$prefix = "http://localhost:$Port/"
$listener = [System.Net.HttpListener]::new()
try {
    $listener.Prefixes.Add($prefix)
    $listener.Start()
} catch {
    Write-Error "Failed to start HttpListener on $prefix - $_"
    exit 1
}

Write-Host "Serving $prefix from" (Get-Location).Path
Write-Host "Open http://localhost:$Port/ in your browser. Press Ctrl+C to stop."

try {
    while ($listener.IsListening) {
        $ctx = $listener.GetContext()
        try {
            $req = $ctx.Request
            $urlPath = $req.Url.LocalPath.TrimStart('/')
            if ([string]::IsNullOrEmpty($urlPath)) { $urlPath = 'AdminDashboard.html' }

            $fullPath = Join-Path (Get-Location).Path $urlPath
            if (-not (Test-Path $fullPath)) {
                $ctx.Response.StatusCode = 404
                $resp = [System.Text.Encoding]::UTF8.GetBytes("404 - Not Found")
                $ctx.Response.OutputStream.Write($resp, 0, $resp.Length)
                $ctx.Response.Close()
                continue
            }

            $ext = [IO.Path]::GetExtension($fullPath).ToLower()
            switch ($ext) {
                '.html' { $mime = 'text/html' }
                '.css'  { $mime = 'text/css' }
                '.js'   { $mime = 'application/javascript' }
                '.json' { $mime = 'application/json' }
                '.png'  { $mime = 'image/png' }
                '.jpg' { $mime = 'image/jpeg' }
                '.jpeg' { $mime = 'image/jpeg' }
                '.svg' { $mime = 'image/svg+xml' }
                '.ico' { $mime = 'image/x-icon' }
                '.woff' { $mime = 'font/woff' }
                '.woff2' { $mime = 'font/woff2' }
                default { $mime = 'application/octet-stream' }
            }

            $bytes = [System.IO.File]::ReadAllBytes($fullPath)
            $ctx.Response.ContentType = $mime
            $ctx.Response.ContentLength64 = $bytes.Length
            $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
            $ctx.Response.Close()
        } catch {
            try { $ctx.Response.StatusCode = 500 } catch {}
            try { $ctx.Response.Close() } catch {}
        }
    }
} finally {
    try { $listener.Stop(); $listener.Close() } catch {}
}
