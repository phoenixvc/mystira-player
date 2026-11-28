$ErrorActionPreference = 'Stop'
$credentialPath = Join-Path $env:USERPROFILE '.mystira-elevenlabs.xml'
if (-not (Test-Path -LiteralPath $credentialPath)) { throw 'The local ElevenLabs credential file is missing.' }
$credential = Import-Clixml -LiteralPath $credentialPath
$env:ELEVENLABS_API_KEY = $credential.GetNetworkCredential().Password
try {
  node (Join-Path $PSScriptRoot 'generate-mummys-party-timing.mjs') --generate
  if ($LASTEXITCODE -ne 0) { throw "Timing generation failed with exit code $LASTEXITCODE." }
} finally {
  Remove-Item Env:ELEVENLABS_API_KEY -ErrorAction SilentlyContinue
}
