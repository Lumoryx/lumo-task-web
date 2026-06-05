; Custom NSIS installer script for Lumo Task
; Injected by electron-builder via build/installer.nsh
;
; On upgrade:
;   1. Detect an existing installation via the registry
;   2. Ask the user whether to keep their data
;   3. If not, wipe %APPDATA%\lumo-task-app before continuing
;   4. Silently uninstall the old version so files are cleanly replaced

!macro customInit
  ; ── Look up the existing uninstall entry ────────────────────────────────────
  ; electron-builder writes the uninstaller path under HKCU for per-user installs
  ; and HKLM for system-wide installs.  Check both.
  StrCpy $R0 ""

  ReadRegStr $R0 HKCU \
    "Software\Microsoft\Windows\CurrentVersion\Uninstall\lumo-task-app" \
    "UninstallString"

  ${If} $R0 == ""
    ReadRegStr $R0 HKLM \
      "Software\Microsoft\Windows\CurrentVersion\Uninstall\lumo-task-app" \
      "UninstallString"
  ${EndIf}

  ; ── Only act when an old installation is actually present ───────────────────
  ${If} $R0 != ""

    ; Ask the user about their data ──────────────────────────────────────────
    MessageBox MB_YESNO|MB_ICONQUESTION \
      "检测到已安装旧版本的 Lumo Task。$\n$\n是否保留您的数据（任务记录、设置等）？$\n$\n• 点击「是」保留数据（推荐）$\n• 点击「否」清除所有数据，全新安装" \
      IDYES lumo_keep_data

    ; User chose to wipe data ────────────────────────────────────────────────
    RMDir /r "$APPDATA\lumo-task-app"

    lumo_keep_data:

    ; Silently uninstall the old version so its files are cleanly removed ────
    ; /S = silent, _?= keeps the $INSTDIR so ExecWait returns correctly
    ExecWait '"$R0" /S _?=$INSTDIR'

  ${EndIf}
!macroend
