import {test} from 'node:test';
import assert from 'node:assert/strict';
import {HealthController} from '../src/health.controller';
test('Mongo readiness pings the connected database',async()=>{
 let pinged=false;
 const controller=new HealthController({readyState:1,db:{admin:()=>({ping:async()=>{pinged=true;}})}} as any);
 assert.deepEqual(await controller.ready(),{status:'ok',database:'mongodb'});assert.ok(pinged);
});
test('Mongo readiness returns 503 when disconnected',async()=>{
 await assert.rejects(new HealthController({readyState:0} as any).ready(),(error:any)=>error.getStatus()===503);
});
