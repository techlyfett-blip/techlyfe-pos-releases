# Tech Lyfe TT POS — Windows desktop app

A thin native window around the hosted Tech Lyfe TT POS. It frames the web app,
keeps receipt printing working, and auto-updates itself when a new release is
published here.

This repository is **public on purpose**, and holds no secrets — only the shell
code and the already-public app URL. Everything behind the login is unchanged
and still requires signing in.

## Download and install

Grab the latest `Tech-Lyfe-TT-POS-Setup-<version>.exe` from the
[**Releases**](../../releases/latest) page and run it.

> On first run Windows SmartScreen may say "unknown publisher" because the
> installer isn't code-signed yet. Click **More info → Run anyway**. (Code
> signing removes this; it needs a purchased certificate.)

## Cutting a new release

Bump `version` in `package.json`, then push a matching tag:

```bash
git tag v1.0.1
git push origin v1.0.1
```

The **Build Windows Installer** GitHub Action builds the `.exe` on a Windows
runner and attaches it to a new Release. Installed copies then auto-update to it.
