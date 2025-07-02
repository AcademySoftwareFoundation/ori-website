#!/usr/bin/env node

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function captureComparison() {
  console.log('🚀 Starting Hugo Site Comparison...\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  // Create screenshots directory
  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }
  
  console.log('📁 Screenshots will be saved to:', screenshotsDir);
  
  // Capture Dev Site
  console.log('\n📸 Capturing Hugo Dev Site (http://localhost:1313/openreviewinitiative/)...');
  const devPage = await context.newPage();
  
  try {
    await devPage.goto('http://localhost:1313/openreviewinitiative/', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    await devPage.waitForTimeout(2000); // Let everything load
    
    await devPage.screenshot({
      path: path.join(screenshotsDir, 'dev-site-full.png'),
      fullPage: true
    });
    
    console.log('✅ Dev site screenshot saved: dev-site-full.png');
    
    // Also capture viewport-sized screenshot
    await devPage.screenshot({
      path: path.join(screenshotsDir, 'dev-site-viewport.png'),
      fullPage: false
    });
    
    console.log('✅ Dev site viewport screenshot saved: dev-site-viewport.png');
    
  } catch (error) {
    console.log('❌ Failed to capture dev site:', error.message);
    console.log('   Make sure Hugo dev server is running at localhost:1313');
  }
  
  await devPage.close();
  
  // Capture Static Site
  console.log('\n📸 Capturing Static Build (http://localhost:8080/)...');
  const staticPage = await context.newPage();
  
  try {
    await staticPage.goto('http://localhost:8080/', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    await staticPage.waitForTimeout(2000); // Let everything load
    
    await staticPage.screenshot({
      path: path.join(screenshotsDir, 'static-site-full.png'),
      fullPage: true
    });
    
    console.log('✅ Static site screenshot saved: static-site-full.png');
    
    // Also capture viewport-sized screenshot
    await staticPage.screenshot({
      path: path.join(screenshotsDir, 'static-site-viewport.png'),
      fullPage: false
    });
    
    console.log('✅ Static site viewport screenshot saved: static-site-viewport.png');
    
  } catch (error) {
    console.log('❌ Failed to capture static site:', error.message);
    console.log('   Make sure static server is running at localhost:8080');
  }
  
  await staticPage.close();
  await browser.close();
  
  console.log('\n🎯 Screenshot capture complete!');
  console.log('📋 Next steps:');
  console.log('   1. Compare the screenshots visually');
  console.log('   2. Check the detailed analysis in hugo-site-comparison-report.md');
  console.log('   3. Fix the base URL configuration as recommended in the report');
  
  // Create a simple HTML comparison viewer
  const htmlViewer = `
<!DOCTYPE html>
<html>
<head>
    <title>Hugo Site Comparison</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .comparison { display: flex; gap: 20px; margin: 20px 0; }
        .site { flex: 1; }
        .site img { width: 100%; border: 1px solid #ccc; }
        .site h3 { text-align: center; margin: 10px 0; }
        .note { background: #f0f8ff; padding: 15px; border-left: 4px solid #007acc; margin: 20px 0; }
    </style>
</head>
<body>
    <h1>Hugo Site Comparison</h1>
    
    <div class="note">
        <strong>Analysis:</strong> The static build is missing theme elements due to asset path mismatches. 
        See <code>hugo-site-comparison-report.md</code> for detailed technical analysis.
    </div>
    
    <h2>Full Page Comparison</h2>
    <div class="comparison">
        <div class="site">
            <h3>Hugo Dev Site (Correct)</h3>
            <img src="dev-site-full.png" alt="Dev Site Full Page">
        </div>
        <div class="site">
            <h3>Static Build (Broken)</h3>
            <img src="static-site-full.png" alt="Static Site Full Page">
        </div>
    </div>
    
    <h2>Viewport Comparison</h2>
    <div class="comparison">
        <div class="site">
            <h3>Hugo Dev Site (Correct)</h3>
            <img src="dev-site-viewport.png" alt="Dev Site Viewport">
        </div>
        <div class="site">
            <h3>Static Build (Broken)</h3>
            <img src="static-site-viewport.png" alt="Static Site Viewport">
        </div>
    </div>
    
    <h2>Key Differences Expected</h2>
    <ul>
        <li><strong>Dev Site:</strong> Full theme styling, carousel, proper navigation, icons</li>
        <li><strong>Static Build:</strong> Plain HTML styling, broken carousel, missing icons</li>
        <li><strong>Root Cause:</strong> Asset paths expect /openreviewinitiative/ but static server serves from /</li>
    </ul>
</body>
</html>`;
  
  fs.writeFileSync(path.join(screenshotsDir, 'comparison.html'), htmlViewer);
  console.log('📄 Created comparison viewer: screenshots/comparison.html');
}

// Handle errors gracefully
captureComparison().catch(error => {
  console.error('💥 Script failed:', error.message);
  console.log('\n🔧 Troubleshooting:');
  console.log('   1. Make sure both sites are running:');
  console.log('      - Hugo dev: hugo server (should run on :1313)');
  console.log('      - Static build: python3 -m http.server 8080 (in public/ directory)');
  console.log('   2. Check if Playwright is installed: npm install @playwright/test');
  console.log('   3. Install browsers: npx playwright install');
  process.exit(1);
});