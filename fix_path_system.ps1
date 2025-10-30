# This script MUST be run as an Administrator.
$machinePath = [Environment]::GetEnvironmentVariable('Path', 'Machine');

if ($machinePath -notlike '*C:\minikube*') {
    $newMachinePath = $machinePath + ';C:\minikube';
    [Environment]::SetEnvironmentVariable('Path', $newMachinePath, 'Machine');
    Write-Host "Success: C:\minikube has been added to the SYSTEM PATH." -ForegroundColor Green
    Write-Host "You MUST restart your computer for this change to take full effect." -ForegroundColor Yellow
} else {
    Write-Host "Info: C:\minikube is already in the SYSTEM PATH." -ForegroundColor Yellow
    Write-Host "If you are still having issues, please restart your computer." -ForegroundColor Yellow
}
