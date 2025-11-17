#!/usr/bin/env pwsh
# Test script for News API endpoints

$baseUrl = "http://localhost:5001/news-app-api-vinci/europe-west1/api"
$delay = 2

Write-Host "Waiting $delay seconds for emulator..." -ForegroundColor Yellow
Start-Sleep -Seconds $delay

Write-Host "`nTesting News API Endpoints`n" -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "1 - GET /api/health" -ForegroundColor Green
try {
  $response = Invoke-RestMethod -Uri "$baseUrl/api/health" -Method GET
  Write-Host "OK - $($response.message)" -ForegroundColor Green
} catch {
  Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 2: Fetch News
Write-Host "2 - POST /api/news/fetch (technology)" -ForegroundColor Green
try {
  $body = @{
    category = "technology"
    limit = 2
  } | ConvertTo-Json
  
  $response = Invoke-RestMethod -Uri "$baseUrl/api/news/fetch" -Method POST -Body $body -ContentType "application/json"
  
  if ($response.ok) {
    Write-Host "OK - Added $($response.addedCount) articles" -ForegroundColor Green
    if ($response.added.Count -gt 0) {
      $script:articleId = $response.added[0].id
      Write-Host "   Title: $($response.added[0].title)" -ForegroundColor Gray
    }
  }
} catch {
  Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}
  
  if ($response.ok) {
    Write-Host "✅ Found $($response.articles.Count) articles" -ForegroundColor Green
    if ($response.articles.Count -gt 0) {
      $script:articleId = $response.articles[0].id
      Write-Host "   First: $($response.articles[0].title)" -ForegroundColor Gray
    }
  }
} catch {
  Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 4: Get Article Details
if ($articleId) {
  Write-Host "4️⃣  GET /api/articles/$articleId" -ForegroundColor Green
  try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/articles/$articleId" -Method GET
    
    if ($response.ok) {
      Write-Host "✅ Article loaded" -ForegroundColor Green
      Write-Host "   Title: $($response.article.title)" -ForegroundColor Gray
      Write-Host "   Summary: $($response.article.summary.Substring(0, [Math]::Min(80, $response.article.summary.Length)))..." -ForegroundColor Gray
      Write-Host "   Sentiment: $($response.article.sentiment)" -ForegroundColor Gray
    }
  } catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
  }

  Write-Host ""

  # Test 5: Add Comment
  Write-Host "5️⃣  POST /api/articles/$articleId/comments" -ForegroundColor Green
  try {
    $body = @{
      text = "Great article! Very informative."
      authorName = "John Doe"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/api/articles/$articleId/comments" `
      -Method POST -Body $body -ContentType "application/json"
    
    if ($response.ok) {
      Write-Host "✅ Comment added" -ForegroundColor Green
      Write-Host "   By: $($response.comment.authorName)" -ForegroundColor Gray
      Write-Host "   Text: $($response.comment.text)" -ForegroundColor Gray
    }
  } catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
  }

  Write-Host ""

  # Test 6: Get Comments
  Write-Host "6️⃣  GET /api/articles/$articleId/comments" -ForegroundColor Green
  try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/articles/$articleId/comments" -Method GET
    
    if ($response.ok) {
      Write-Host "✅ Found $($response.comments.Count) comments" -ForegroundColor Green
      if ($response.comments.Count -gt 0) {
        Write-Host "   First: $($response.comments[0].text)" -ForegroundColor Gray
        Write-Host "   By: $($response.comments[0].authorName)" -ForegroundColor Gray
      }
    }
  } catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
  }
}

Write-Host "`nTest suite completed!" -ForegroundColor Cyan
