PowerShell static server (no Python required)
===========================================

This workspace includes `serve.ps1`, a small PowerShell script that serves files over HTTP on `localhost` so you can open the HTML pages in your browser without installing Python.

Usage
-----

1. Open PowerShell and change to the project folder:

```powershell
cd 'C:\SE code - EXPERIMENTAL'
```

2. Run the server (default port 8000):

```powershell
.\serve.ps1 -Port 8000
```

3. Open a page in your browser, for example:

    - http://localhost:8000/AdminDashboard.html
    - http://localhost:8000/SettingsPage.html

Notes
-----

- `serve.ps1` binds to `http://localhost:<port>/` so it does not require URL ACL changes.
- If you need to serve on a non-localhost hostname or all interfaces, you'll need admin privileges and to add an URL ACL.
- Press Ctrl+C in the PowerShell window to stop the server.

Removal of Python notes
-----------------------

Earlier instructions suggested using `python -m http.server`. That is optional — use `serve.ps1` instead to avoid installing Python.
