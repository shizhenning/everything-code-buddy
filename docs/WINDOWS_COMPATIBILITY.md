# Windows Compatibility Guide

## Overview

Everything Claude Code (ECC) is cross-platform compatible. This guide covers Windows-specific considerations and setup.

## System Requirements

- Windows 10 or later
- Git for Windows (includes Git Bash)
- Node.js 16+
- Optional: WSL2 for full Unix compatibility

## Installation on Windows

### Option 1: Git Bash (Recommended)

Git for Windows includes Git Bash, which provides Unix-compatible shell support.

1. Install Git for Windows: https://git-scm.com/download/win
2. Clone the repository:
   ```bash
   git clone https://github.com/affaan-m/everything-claude-code.git
   cd everything-claude-code
   ```
3. Run installation in Git Bash:
   ```bash
   ./install.sh typescript
   ```

### Option 2: WSL2

For full Unix compatibility, use Windows Subsystem for Linux:

1. Enable WSL2:
   ```powershell
   wsl --install
   ```
2. Install Ubuntu or preferred Linux distro
3. Follow Unix instructions in WSL terminal

### Option 3: PowerShell (Limited Support)

Some scripts require Unix shell features. For PowerShell:

1. Install Node.js and Git
2. Manual setup steps:
   ```powershell
   # Create plugin directory
   New-Item -ItemType Directory -Path "$env:USERPROFILE\.codebuddy" -Force
   
   # Copy plugin.json (manual)
   Copy-Item .codebuddy\plugin.json "$env:USERPROFILE\.codebuddy\"
   ```

## Path Handling

### Junction Links

On Windows, junction links are used instead of symlinks for `.codebuddy/` directory:

```powershell
# Create junction (PowerShell)
New-Item -ItemType Junction -Path .codebuddy -Target "d:\UGit\everything-code-buddy\.codebuddy"
```

**Important**: Junction links provide real-time sync with zero disk overhead.

### Environment Variables

Set these in Windows System Properties:

```powershell
# PowerShell
$env:CODEBUDDY_PROJECT_DIR = "d:\path\to\your\project"
$env:CODEBUDDY_PLUGIN_ROOT = "d:\path\to\ecc\.codebuddy"

# CMD
set CODEBUDDY_PROJECT_DIR=d:\path\to\your\project
set CODEBUDDY_PLUGIN_ROOT=d:\path\to\ecc\.codebuddy
```

Permanent setup (PowerShell Administrator):

```powershell
[System.Environment]::SetEnvironmentVariable('CODEBUDDY_PROJECT_DIR', 'd:\path\to\project', 'User')
[System.Environment]::SetEnvironmentVariable('CODEBUDDY_PLUGIN_ROOT', 'd:\path\to\ecc\.codebuddy', 'User')
```

## Known Limitations

### Shell Scripts

These Unix shell scripts require Git Bash or WSL:

- `install.sh` - Use Git Bash
- `install-codebuddy.sh` - Use Git Bash
- `scripts/release.sh` - Development only
- `skills/*/evaluate-session.sh` - Use Git Bash
- `skills/*/suggest-compact.sh` - Use Git Bash

**Workaround**: Run in Git Bash:
```bash
cd /d/UGit/everything-claude-code
./install.sh typescript
```

### File Path Separators

Windows uses `\` but CodeBuddy uses `/` in configs. Both work in Node.js and Python:

```javascript
// Both work
const path = require('path');
path.join('folder', 'file.js');  // Platform-specific separator
path.normalize('folder/file.js'); // Converts to platform format
```

### Hook Scripts

All hook scripts are written in Node.js for cross-platform compatibility:

- `.codebuddy/hooks/observe.js` - Works on Windows
- `.codebuddy/hooks/run-observer-on-stop.js` - Works on Windows

## Troubleshooting

### Issue: "Permission Denied" on Scripts

**Solution**: In Git Bash, make scripts executable:
```bash
chmod +x install.sh
```

Or run with `bash`:
```bash
bash install.sh typescript
```

### Issue: Path Too Long

**Solution**: Enable Windows long path support (PowerShell Administrator):
```powershell
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" `
  -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
```

### Issue: Junction Links Don't Sync

**Solution**: Recreate junction:
```powershell
Remove-Item -Path .codebuddy -Force -Recurse
New-Item -ItemType Junction -Path .codebuddy -Target "d:\UGit\everything-code-buddy\.codebuddy"
```

### Issue: Python Not Found

**Solution**: Install Python 3.9+ and add to PATH, or use python3 launcher:
```powershell
winget install Python.Python.3.11
```

## Development Setup

For development on Windows:

1. Use VS Code with Git Bash terminal
2. Install ESLint extension
3. Run tests in PowerShell or Git Bash:
   ```powershell
   node tests/run-all.js
   ```

### Running Tests

```powershell
# PowerShell
node tests/run-all.js

# Git Bash
./tests/run-all.js
```

## CI/CD

Windows CI is not currently set up. For cross-platform verification:

- Use GitHub Actions with `windows-latest` runner
- Test in both PowerShell and Git Bash environments

## Additional Resources

- [Git for Windows](https://git-scm.com/download/win)
- [WSL2 Installation](https://docs.microsoft.com/en-us/windows/wsl/install)
- [Node.js Windows Installation](https://nodejs.org/en/download/)
- [PowerShell Core](https://github.com/PowerShell/PowerShell)
