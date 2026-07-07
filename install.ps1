
# Simulate pressing R (Run once) for both prompts
$wshell = New-Object -ComObject WScript.Shell
Start-Sleep -Milliseconds 500
$wshell.SendKeys("R{ENTER}")
Start-Sleep -Milliseconds 500
$wshell.SendKeys("R{ENTER}")
Start-Sleep -Milliseconds 2000

# Now run npm install
npm install

# Then run npm run dev
npm run dev
