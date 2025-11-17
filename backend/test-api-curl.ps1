#!/usr/bin/env pwsh
# Test script for News API endpoints using curl

$baseUrl = "http://localhost:5001/news-app-api-vinci/europe-west1/api"
$delay = 3  # seconds to wait for emulator to start

Write-Host "⏳ Waiting $delay seconds for emulator to start..." -ForegroundColor Yellow
Start-Sleep -Seconds $delay

Write-Host "`n📌 Testing News API Endpoints`n" -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "1️⃣  Testing GET /api/health" -ForegroundColor Green
curl -s "$baseUrl/api/health" | ConvertFrom-Json | ConvertTo-Json | Write-Host

Write-Host ""

# Test 2: Fetch News
Write-Host "2️⃣  Testing POST /api/news/fetch (technology)" -ForegroundColor Green
$response = curl -s -X POST "$baseUrl/api/news/fetch" `
  -H "Content-Type: application/json" `
  -d '{"category":"technology","limit":2}'

$json = $response | ConvertFrom-Json
Write-Host ($json | ConvertTo-Json -Depth 2)

if ($json.added.Count -gt 0) {
  $script:articleId = $json.added[0].id
  Write-Host "📝 Saved article ID: $articleId" -ForegroundColor Cyan
}

Write-Host ""

# Test 3: Get News List
Write-Host "3️⃣  Testing GET /api/news (all)" -ForegroundColor Green
$response = curl -s "$baseUrl/api/news?limit=5"
$json = $response | ConvertFrom-Json
Write-Host "Found $($json.articles.Count) articles"

if ($json.articles.Count -gt 0) {
  Write-Host "First article: $($json.articles[0].title)" -ForegroundColor Gray
  $script:articleId = $json.articles[0].id
}

Write-Host ""

# Test 4: Get Article Details
if ($articleId) {
  Write-Host "4️⃣  Testing GET /api/articles/$articleId" -ForegroundColor Green
  curl -s "$baseUrl/api/articles/$articleId" | ConvertFrom-Json | ConvertTo-Json -Depth 2 | Write-Host

  Write-Host ""

  # Test 5: Add Comment
  Write-Host "5️⃣  Testing POST /api/articles/$articleId/comments" -ForegroundColor Green
  $response = curl -s -X POST "$baseUrl/api/articles/$articleId/comments" `
    -H "Content-Type: application/json" `
    -d '{"text":"Great article! Very informative.","authorName":"John Doe"}'

  $json = $response | ConvertFrom-Json
  Write-Host ($json | ConvertTo-Json)
  $script:commentId = $json.comment.id

  Write-Host ""

  # Test 6: Get Comments
  Write-Host "6️⃣  Testing GET /api/articles/$articleId/comments" -ForegroundColor Green
  curl -s "$baseUrl/api/articles/$articleId/comments" | ConvertFrom-Json | ConvertTo-Json -Depth 2 | Write-Host
}

Write-Host "`n✨ Test suite completed!" -ForegroundColor Cyan
Write-Host "Press Ctrl+C in the other terminal to stop the emulator" -ForegroundColor Yellow
