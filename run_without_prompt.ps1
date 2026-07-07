
# Add necessary assemblies
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Threading

# Wait a bit for the prompt to appear
Start-Sleep -Seconds 2

# Press "A" for Always run" and Enter
[System.Windows.Forms.SendKeys]::SendWait("A")
Start-Sleep -Milliseconds 500
[System.Windows.Forms.SendKeys]::SendWait("{ENTER}")

# Wait a bit and press again in case there's a second prompt
Start-Sleep -Seconds 1
[System.Windows.Forms.SendKeys]::SendWait("A")
Start-Sleep -Milliseconds 500
[System.Windows.Forms.SendKeys]::SendWait("{ENTER}")

# Now install dependencies
npm install

# Start dev server
npm run dev
