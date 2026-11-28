$ErrorActionPreference = 'Stop'
$credentialPath = Join-Path $env:USERPROFILE '.mystira-elevenlabs.xml'
$credential = Import-Clixml -LiteralPath $credentialPath
if ($credential -isnot [pscredential]) { throw 'The saved ElevenLabs credential is not a PSCredential.' }
$env:ELEVENLABS_API_KEY = $credential.GetNetworkCredential().Password
try {
    node (Join-Path $PSScriptRoot 'generate-mummys-party-voices.mjs') --generate
    $result = $LASTEXITCODE
} finally {
    Remove-Item Env:ELEVENLABS_API_KEY -ErrorAction SilentlyContinue
}
exit $result
