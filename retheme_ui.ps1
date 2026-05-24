$files = Get-ChildItem -Path '.' -Include '*.tsx' -Recurse -Exclude 'node_modules', 'dist', '.git'
foreach ($file in $files) {
    $c = Get-Content $file.FullName -Raw -Encoding UTF8
    
    # Text colors
    $c = $c -replace 'text-\[\#1E3A8A\]', 'text-brand-primary'
    $c = $c -replace 'text-\[\#003366\]', 'text-brand-primary'
    $c = $c -replace 'text-indigo-900', 'text-brand-primary'
    $c = $c -replace 'text-indigo-800', 'text-brand-primary'
    $c = $c -replace 'text-indigo-700', 'text-brand-primary'
    $c = $c -replace 'text-indigo-600', 'text-brand-primary'
    
    $c = $c -replace 'text-\[\#F59E0B\]', 'text-brand-secondary'
    $c = $c -replace 'text-\[\#14b8a6\]', 'text-brand-secondary'
    $c = $c -replace 'text-amber-600', 'text-brand-secondary'
    $c = $c -replace 'text-yellow-600', 'text-brand-secondary'
    $c = $c -replace 'text-teal-600', 'text-brand-secondary'
    $c = $c -replace 'text-teal-500', 'text-brand-secondary'

    $c = $c -replace 'text-slate-900', 'text-brand-ink'
    $c = $c -replace 'text-slate-800', 'text-brand-ink'
    
    # Background colors
    $c = $c -replace 'bg-\[\#1E3A8A\]', 'bg-brand-primary'
    $c = $c -replace 'bg-\[\#003366\]', 'bg-brand-primary'
    $c = $c -replace 'bg-indigo-900', 'bg-brand-primary'
    $c = $c -replace 'bg-indigo-800', 'bg-brand-primary'
    $c = $c -replace 'bg-indigo-700', 'bg-brand-primary'
    $c = $c -replace 'bg-indigo-600', 'bg-brand-primary'
    
    $c = $c -replace 'bg-\[\#F59E0B\]', 'bg-brand-secondary'
    $c = $c -replace 'bg-\[\#14b8a6\]', 'bg-brand-secondary'
    $c = $c -replace 'bg-amber-600', 'bg-brand-secondary'
    $c = $c -replace 'bg-yellow-600', 'bg-brand-secondary'
    $c = $c -replace 'bg-teal-600', 'bg-brand-secondary'
    $c = $c -replace 'bg-teal-500', 'bg-brand-secondary'
    
    $c = $c -replace 'bg-indigo-50/50', 'bg-brand-surface'
    $c = $c -replace 'bg-indigo-50', 'bg-brand-surface'
    $c = $c -replace 'bg-indigo-100', 'bg-brand-surface'
    
    # Borders
    $c = $c -replace 'border-\[\#1E3A8A\]', 'border-brand-primary'
    $c = $c -replace 'border-\[\#003366\]', 'border-brand-primary'
    $c = $c -replace 'border-indigo-600', 'border-brand-primary'
    $c = $c -replace 'border-indigo-700', 'border-brand-primary'
    
    $c = $c -replace 'border-\[\#F59E0B\]', 'border-brand-secondary'
    $c = $c -replace 'border-\[\#14b8a6\]', 'border-brand-secondary'
    
    Set-Content $file.FullName $c -NoNewline -Encoding UTF8
    Write-Host ("Updated: " + $file.Name)
}
Write-Host "DONE - All files mapped to semantic brand colors!"
