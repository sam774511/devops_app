$oldPath = [Environment]::GetEnvironmentVariable('Path', 'User');

if ($oldPath -notlike '*C:\minikube*') {
    [Environment]::SetEnvironmentVariable('Path', $oldPath + ';C:\minikube', 'User')
    Write-Host "Success: C:\minikube has been added to your PATH." -ForegroundColor Green
} else {
    Write-Host "Info: C:\minikube is already in your PATH." -ForegroundColor Yellow
}
