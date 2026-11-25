const { chromium } = require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1440,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://localhost:8080');await page.waitForTimeout(1500);await page.screenshot({path:'/workspace/web/desktop-preview.png'});
 let passed=0;function check(ok,label){if(!ok)throw Error(label);console.log('PASS '+label);passed++;}
 check(await page.locator('#play').isVisible(),'start screen');await page.click('#play');await page.waitForTimeout(200);check((await page.evaluate(()=>gameState())).active,'start game');
 const before=await page.evaluate(()=>gameState().position);await page.keyboard.down('KeyW');await page.waitForTimeout(400);await page.keyboard.up('KeyW');check((await page.evaluate(()=>gameState().position))[2]<before[2],'keyboard movement');
 await page.keyboard.press('Digit2');check((await page.evaluate(()=>gameState())).slot===1,'pickaxe shortcut');
 await page.evaluate(()=>{pitch=-.65;});await page.waitForTimeout(80);const blocks=await page.evaluate(()=>gameState().blocks);await page.evaluate(()=>use());check((await page.evaluate(()=>gameState())).blocks===blocks-1,'mine block');
 await page.waitForTimeout(300);await page.evaluate(()=>equip(2));await page.waitForTimeout(80);const mined=await page.evaluate(()=>gameState().blocks);await page.evaluate(()=>{lastAction=-10;use(true)});check((await page.evaluate(()=>gameState())).blocks===mined+1,'place block: '+await page.locator('#toast').textContent());
 await page.keyboard.press('Escape');await page.waitForTimeout(100);check(await page.locator('#modal').isVisible(),'pause controls');await page.click('#resume');await page.waitForTimeout(100);await page.evaluate(()=>{pitch=0;});await page.screenshot({path:'/workspace/web/game-preview.png'});
 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});mobile.on('pageerror',e=>errors.push(e.message));await mobile.goto('http://localhost:8080');await mobile.waitForTimeout(700);await mobile.click('#play');check(await mobile.locator('#joystick').isVisible(),'mobile joystick visible');await mobile.click('[data-slot="4"]');check((await mobile.evaluate(()=>gameState())).slot===4,'touch tool selection');await mobile.click('#jump');await mobile.screenshot({path:'/workspace/web/mobile-preview.png'});check(errors.length===0,'no browser runtime errors');console.log(`${passed} checks passed`);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
