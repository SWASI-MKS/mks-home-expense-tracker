
Add-Type -AssemblyName System.Windows.Forms
Start-Sleep -Seconds 1
[System.Windows.Forms.SendKeys]::SendWait("R")
Start-Sleep -Milliseconds 500
[System.Windows.Forms.SendKeys]::SendWait("{ENTER}")
Start-Sleep -Seconds 1
[System.Windows.Forms.SendKeys]::SendWait("R")
Start-Sleep -Milliseconds 500
[System.Windows.Forms.SendKeys]::SendWait("{ENTER}")
Start-Sleep -Seconds 2

Write-Host "Starting npm install..."
npm install

Write-Host "Starting dev server..."
npm run dev
