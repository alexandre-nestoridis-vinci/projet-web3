#!/usr/bin/env pwsh
# Test script for News API endpoints

$baseUrl = "http://localhost:5001/news-app-api-vinci/europe-west1/api"
$delay = 4  # seconds to wait for emulator to start

Write-Host "⏳ Waiting $delay seconds for emulator to start..." -ForegroundColor Yellow
Start-Sleep -Seconds $delay

Write-Host "`n📌 Testing News API Endpoints`n" -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "1️⃣  Testing GET /api/health" -ForegroundColor Green
try {
  $response = Invoke-WebRequest -Uri "$baseUrl/api/health" -Method GET -ErrorAction Stop
  Write-Host "✅ Status: $($response.StatusCode)" -ForegroundColor Green
  Write-Host "Response: $($response.Content)" -ForegroundColor Gray
} catch {
  Write-Host "❌ Error: $_" -ForegroundColor Red
}

Write-Host ""

# Test 2: Fetch News
Write-Host "2️⃣  Testing POST /api/news/fetch (technology)" -ForegroundColor Green
try {
  $body = @{
    category = "technology"
    limit = 2
  } | ConvertTo-Json
  
  $response = Invoke-WebRequest -Uri "$baseUrl/api/news/fetch" -Method POST -Body $body `
    -ContentType "application/json" -ErrorAction Stop
  Write-Host "✅ Status: $($response.StatusCode)" -ForegroundColor Green
  $json = $response.Content | ConvertFrom-Json
  Write-Host "Response: $($json | ConvertTo-Json -Depth 2)" -ForegroundColor Gray
  
  if ($json.added.Count -gt 0) {
    $articleId = $json.added[0].id
    Write-Host "📝 Saved article ID: $articleId" -ForegroundColor Cyan
  }
} catch {
  Write-Host "❌ Error: $_" -ForegroundColor Red
}

Write-Host ""

# Test 3: Get News List
Write-Host "3️⃣  Testing GET /api/news (all)" -ForegroundColor Green
try {
  $response = Invoke-WebRequest -Uri "$baseUrl/api/news?limit=5" -Method GET -ErrorAction Stop
  Write-Host "✅ Status: $($response.StatusCode)" -ForegroundColor Green
  $json = $response.Content | ConvertFrom-Json
  Write-Host "Found $($json.articles.Count) articles" -ForegroundColor Gray
  if ($json.articles.Count -gt 0) {
    Write-Host "First article: $($json.articles[0].title)" -ForegroundColor Gray
    $articleId = $json.articles[0].id
  }
} catch {
  Write-Host "❌ Error: $_" -ForegroundColor Red
}

Write-Host ""

# Test 4: Get Article Details
if ($articleId) {
  Write-Host "4️⃣  Testing GET /api/articles/$articleId" -ForegroundColor Green
  try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/articles/$articleId" -Method GET -ErrorAction Stop
    Write-Host "✅ Status: $($response.StatusCode)" -ForegroundColor Green
    $json = $response.Content | ConvertFrom-Json
    Write-Host "Article: $($json.article.title)" -ForegroundColor Gray
    Write-Host "Summary: $($json.article.summary.Substring(0, [Math]::Min(100, $json.article.summary.Length)))..." -ForegroundColor Gray
  } catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
  }

  Write-Host ""

  # Test 5: Add Comment
  Write-Host "5️⃣  Testing POST /api/articles/$articleId/comments" -ForegroundColor Green
  try {
    $body = @{
      text = "Great article! Very informative."
      authorName = "John Doe"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$baseUrl/api/articles/$articleId/comments" -Method POST `
      -Body $body -ContentType "application/json" -ErrorAction Stop
    Write-Host "✅ Status: $($response.StatusCode)" -ForegroundColor Green
    $json = $response.Content | ConvertFrom-Json
    Write-Host "Comment ID: $($json.comment.id)" -ForegroundColor Gray
    Write-Host "Author: $($json.comment.authorName)" -ForegroundColor Gray
    $commentId = $json.comment.id
  } catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
  }

  Write-Host ""

  # Test 6: Get Comments
  Write-Host "6️⃣  Testing GET /api/articles/$articleId/comments" -ForegroundColor Green
  try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/articles/$articleId/comments" -Method GET -ErrorAction Stop
    Write-Host "✅ Status: $($response.StatusCode)" -ForegroundColor Green
    $json = $response.Content | ConvertFrom-Json
    Write-Host "Found $($json.comments.Count) comments" -ForegroundColor Gray
    if ($json.comments.Count -gt 0) {
      Write-Host "First comment: $($json.comments[0].text)" -ForegroundColor Gray
      Write-Host "By: $($json.comments[0].authorName)" -ForegroundColor Gray
    }
  } catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
  }
}

Write-Host "`n✨ Test suite completed!" -ForegroundColor Cyan
