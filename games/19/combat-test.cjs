const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({args:['--no-sandbox']});const p=await b.newPage({viewport:{width:480,height:360}});await p.goto('http://localhost:8080');await p.evaluate(()=>{renderer.shadowMap.enabled=false;renderer.setPixelRatio(1);renderer.setSize(320,240);});await p.click('#play');const result=await p.evaluate(()=>{
 let checks=0;function assert(v,s){if(!v)throw Error(s);checks++;}
 fruits.forEach(f=>scene.remove(f.mesh));fruits.length=0;pandas.forEach(p=>p.cool=999);yaw=0;pitch=0;camera.position.copy(pos);camera.rotation.set(0,0,0);equip(0);
 const p=pandas[0];p.group.position.copy(pos).add(new THREE.Vector3(0,-1.2,-2));p.hp=1;p.alive=true;lastAction=-10;use();assert(kills===1,'sword repels panda');
 function fruit(){const mesh=makeFruit();mesh.position.copy(pos).add(new THREE.Vector3(0,0,-.4));scene.add(mesh);fruits.push({mesh,v:new THREE.Vector3(),life:2});}
 let old=hp;equip(4);fruit();update(.001);assert(hp===old,'shield blocks pineapple');equip(0);fruit();update(.001);assert(hp===old-1,'pineapple damages player');
 const count=fruits.length;pandas[1].group.position.copy(pos).add(new THREE.Vector3(0,-1.7,-5));pandas[1].cool=0;update(.001);assert(fruits.length>count,'panda throws pineapple');
 grounded=true;jump();assert(vy>0&&!grounded,'jump lifts player');assert(Math.abs(hand.position.x)<=camera.aspect*.3+.001,'held tool fits viewport');return checks;
 });console.log(result+' combat and movement checks passed');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
