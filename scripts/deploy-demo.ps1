# Servis demo untuk ujian: portal-ppd-dalat-demo dengan pangkalan data berasingan (portal_ppd_demo)
# pada instance Cloud SQL yang sama. Tetapan disalin daripada servis sebenar; nilai rahsia tidak dipaparkan.
# MOD_DEMO=1: log masuk demo tanpa Google, dan data ujian penuh dimuat automatik apabila pangkalan data kosong.
# Data sebenar (portal_ppd) tidak disentuh. Padam servis demo: gcloud run services delete portal-ppd-dalat-demo --region asia-southeast1
$ErrorActionPreference = 'Stop'
$P = 'prestij-nurazwann-smartassist'; $R = 'asia-southeast1'
$SRC = 'portal-ppd-dalat'; $DEMO = 'portal-ppd-dalat-demo'
$INST = 'portal-ppd-db'; $DB = 'portal_ppd_demo'

Write-Host '1/4 Pangkalan data demo...'
$ada = @(gcloud sql databases list --instance $INST --project $P --format='value(name)')
if ($ada -notcontains $DB) { gcloud sql databases create $DB --instance $INST --project $P --quiet }
else { Write-Host "    $DB sudah wujud" }

Write-Host '2/4 Baca tetapan servis sebenar...'
$svc = (gcloud run services describe $SRC --region $R --project $P --format=json) -join "`n" | ConvertFrom-Json
$c = $svc.spec.template.spec.containers[0]
$ann = $svc.spec.template.metadata.annotations
$egress = $ann.'run.googleapis.com/vpc-access-egress'; if (-not $egress) { $egress = 'private-ranges-only' }

$ev = [ordered]@{}; $rahsia = @()
foreach ($e in @($c.env)) {
  if ($null -eq $e) { continue }
  if ($e.valueFrom -and $e.valueFrom.secretKeyRef) { $rahsia += "$($e.name)=$($e.valueFrom.secretKeyRef.name):$($e.valueFrom.secretKeyRef.key)" }
  else { $ev[$e.name] = [string]$e.value }
}
$ev['MOD_DEMO'] = '1'
$ev['DATABASE_NAME'] = $DB
# Sesi demo berasingan daripada sesi sebenar
$ev['SESSION_SECRET'] = -join ((1..48) | ForEach-Object { '{0:x}' -f (Get-Random -Maximum 16) })

$fail = Join-Path $env:TEMP 'ppd-demo-env.yaml'
$rahsia = @($rahsia | Where-Object { -not $ev.Contains(($_ -split '=')[0]) })
$teks = ($ev.GetEnumerator() | ForEach-Object { "$($_.Key): $(ConvertTo-Json ([string]$_.Value))" }) -join "`n"
[IO.File]::WriteAllText($fail, $teks, (New-Object System.Text.UTF8Encoding $false))

Write-Host '3/4 Deploy servis demo (imej yang sama dengan servis sebenar)...'
$arg = @('run', 'deploy', $DEMO, '--image', $c.image, '--region', $R, '--project', $P, '--quiet',
  '--allow-unauthenticated', '--env-vars-file', $fail,
  '--network', 'default', '--subnet', 'default', '--vpc-egress', $egress)
if ($svc.spec.template.spec.serviceAccountName) { $arg += @('--service-account', $svc.spec.template.spec.serviceAccountName) }
if ($c.resources.limits.memory) { $arg += @('--memory', $c.resources.limits.memory) }
if ($c.resources.limits.cpu) { $arg += @('--cpu', $c.resources.limits.cpu) }
if ($svc.spec.template.spec.timeoutSeconds) { $arg += @('--timeout', [string]$svc.spec.template.spec.timeoutSeconds) }
$sql = $ann.'run.googleapis.com/cloudsql-instances'
if ($sql) { $arg += @('--set-cloudsql-instances', $sql) }
if ($rahsia.Count) { $arg += @('--set-secrets', ($rahsia -join ',')) }
try { & gcloud @arg } finally { Remove-Item $fail -ErrorAction SilentlyContinue }
if ($LASTEXITCODE -ne 0) { throw 'Deploy servis demo gagal.' }

Write-Host '4/4 Muat data ujian...'
$url = gcloud run services describe $DEMO --region $R --project $P --format='value(status.url)'
# Tanpa log masuk /api/stor memulangkan 401, tetapi permintaan itu sudah mencetuskan muatan data ujian
try { $kod = (Invoke-WebRequest -UseBasicParsing "$url/api/stor" -TimeoutSec 120).StatusCode } catch { $kod = [int]$_.Exception.Response.StatusCode }
Write-Host "    /api/stor: $kod $(if ($kod -eq 200 -or $kod -eq 401) { '(OK)' } else { '(semak log: gcloud run services logs read ' + $DEMO + ')' })"
Write-Host ''
Write-Host "Servis demo sedia: $url"
