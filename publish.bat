@echo off
rem Publish changes: validate data -> commit -> sync with GitHub -> push.
rem Vercel deploys automatically after every push to main.
rem Usage:  publish.bat                (asks for a message)
rem         publish.bat Fixed Altalena date
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo === 1/4  Validating data ===
call npm run validate
if errorlevel 1 goto fail

echo.
echo === 2/4  Committing changes ===
git add -A
git diff --cached --quiet
if not errorlevel 1 (
  echo No local changes to commit.
  goto sync
)
git status --short
set "MSG=%*"
if "%MSG%"=="" set /p "MSG=Describe the change (Enter = Update): "
if "%MSG%"=="" set "MSG=Update"
git commit -q -m "%MSG%"
if errorlevel 1 goto fail

:sync
echo.
echo === 3/4  Pulling changes from the other computer ===
git pull --rebase -q
if errorlevel 1 goto fail

echo.
echo === 4/4  Pushing to GitHub ===
git push -q
if errorlevel 1 goto fail

echo.
echo ============================================================
echo  Done. Vercel will update the site in about a minute:
echo  https://israelhistory.vercel.app
echo  Build status: https://vercel.com/davidklein1/israel-history
echo ============================================================
pause
exit /b 0

:fail
echo.
echo ************************************************************
echo  FAILED - nothing was published. Read the error above.
echo  See section 6 in WORKFLOW.md for common problems.
echo ************************************************************
pause
exit /b 1
