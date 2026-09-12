import { chromium } from "playwright";
const OUT=process.argv[2];
const b=await chromium.launch({executablePath:"/usr/bin/google-chrome",headless:true});
const p=await b.newPage({viewport:{width:1152,height:720}});
await p.goto("http://localhost:1420/?scene=stocked"); await p.waitForTimeout(2500);
const btn=(l)=>p.locator("button.tool",{hasText:l}).first();
const shots=[["Guide","guide"],["Shop","shop"],["Change water","care"],["Test water","stats"],["Settings","settings"]];
for(const [label,name] of shots){ await btn(label).click(); await p.waitForTimeout(600); await p.screenshot({path:`${OUT}/${name}.png`}); if(name==="shop"){ for(const tab of ["gear","supplies","decor"]){ await p.locator("button.tab",{hasText:tab}).click(); await p.waitForTimeout(300); await p.screenshot({path:`${OUT}/shop-${tab}.png`}); } } await p.keyboard.press("Escape"); await p.waitForTimeout(300); }
// inspect a fish: click near a fish position read from canvas? click centre of water and hope
await p.mouse.click(576, 300); await p.waitForTimeout(500); await p.screenshot({path:`${OUT}/inspect.png`}); await p.keyboard.press("Escape");
await p.goto("http://localhost:1420/?scene=welcome"); await p.waitForTimeout(2000); await p.screenshot({path:`${OUT}/welcome.png`});
await b.close();
