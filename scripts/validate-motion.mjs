import assert from 'node:assert/strict';
import {frameDelta} from '../app/motion.ts';
for(const target of [0,1]){
 let amount=1-target;
 const timestamps=[100,116,132,80,96,5000,5016,NaN,5032];
 for(let i=1;i<timestamps.length;i++){
  const dt=frameDelta(timestamps[i],timestamps[i-1]);
  const before=Math.abs(amount-target);
  amount+=(target-amount)*(1-Math.exp(-dt*6));
  assert.ok(Number.isFinite(amount)&&amount>=0&&amount<=1);
  assert.ok(Math.abs(amount-target)<=before);
 }
}
console.log('Assembly motion stays bounded and converges across timeline resets.');
