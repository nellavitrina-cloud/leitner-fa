const {chromium}=require('playwright');
const {spawn}=require('node:child_process');
const assert=require('node:assert/strict');
const path=require('node:path');
const root=__dirname;
(async()=>{
 const server=spawn(process.execPath,[path.join(root,'server.js')],{stdio:'pipe'});
 let browser;
 try {
  await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',code=>reject(Error('server exit '+code)));});
  browser=await chromium.launch({headless:true,channel:"msedge"});
  const context=await browser.newContext({acceptDownloads:true}); const page=await context.newPage(); const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8080');
  await page.locator('#reveal').click(); await page.locator('#correct').click();
  assert.equal(await page.locator('#todayCount').innerText(),'۱');
  await page.reload(); assert.equal(await page.locator('#todayCount').innerText(),'۱');
  await page.locator('#mode').selectOption('all'); await page.locator('#reveal').click(); await page.locator('#wrong').click();
  await page.locator('#undo').click(); assert.equal(await page.locator('#todayCount').innerText(),'۱');
  await page.locator('[data-tab="library"]').click(); await page.locator('#libSearch').fill('notpresent'); assert.equal(await page.locator('[data-card]').count(),0);
  await page.locator('#libSearch').fill('آمد'); await page.locator('[data-card]').click(); assert.equal(await page.locator('#detail').evaluate(e=>e.open),true); await page.locator('#closeDetail').click();
  await page.locator('[data-tab="stats"]').click();
  const downloadPromise=page.waitForEvent('download'); await page.locator('#export').click(); const download=await downloadPromise; await download.saveAs(path.join(require('node:os').tmpdir(),'leitner-test-backup.json'));
  page.on('dialog',d=>d.accept()); await page.locator('#reset').click(); assert.equal(await page.locator('#todayCount').innerText(),'۰');
  await page.locator('#importFile').setInputFiles(path.join(require('node:os').tmpdir(),'leitner-test-backup.json')); await page.waitForFunction(()=>document.getElementById('todayCount').textContent==='۱');
  await page.locator('#importFile').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{bad')}); await page.waitForFunction(()=>document.getElementById('toast').textContent.includes('معتبر نیست')); assert.equal(await page.locator('#todayCount').innerText(),'۱');
  await page.evaluate(()=>navigator.serviceWorker.ready); await page.reload();
  await context.setOffline(true); await page.reload(); await page.locator('#mode').selectOption('all'); await page.locator('#reveal').click(); assert.ok((await page.locator('#study').innerText()).includes('آمدن')); await context.setOffline(false);
  await page.setViewportSize({width:390,height:844}); assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false); await page.screenshot({path:path.join(require('node:os').tmpdir(),'leitner-test-mobile.png'),fullPage:true});
  await page.goto('http://127.0.0.1:8080/leitner-fa.html'); await page.waitForURL('**/index.html');
  assert.deepEqual(errors,[]);
  const corrupt=await browser.newContext(); await corrupt.addInitScript(()=>localStorage.setItem('vazhe-vazhe-progress-v1','broken'));
  const p2=await corrupt.newPage(); await p2.goto('http://127.0.0.1:8080'); assert.equal(await p2.locator('#storageWarning').isVisible(),true); await p2.locator('#reveal').click(); await p2.locator('#correct').click(); assert.equal(await p2.evaluate(()=>localStorage.getItem('vazhe-vazhe-progress-v1')),'broken');
  console.log('PASS: review, scheduling UI, reload persistence, undo, search, detail dialog, export/import/reset, invalid backup, offline reload, mobile overflow, legacy URL, corrupt storage, no page errors');
 } finally {if(browser)await browser.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1});


