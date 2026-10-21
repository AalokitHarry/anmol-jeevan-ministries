const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

class Range {
  constructor(sheet,row,col,height=1,width=1){Object.assign(this,{sheet,row,col,height,width});if(height<1||width<1)throw new Error('Invalid range');}
  getValues(){return Array.from({length:this.height},(_,r)=>Array.from({length:this.width},(_,c)=>this.sheet.rows[this.row+r-1]?.[this.col+c-1]??''));}
  setValues(values){values.forEach((row,r)=>row.forEach((value,c)=>{this.sheet.rows[this.row+r-1]??=[];this.sheet.rows[this.row+r-1][this.col+c-1]=value;}));return this;}
  setValue(value){return this.setValues([[value]]);}
  setNumberFormat(){return this;}
}
class Sheet {
  constructor(rows=[]){this.rows=rows.map(row=>row.slice());}
  getLastRow(){return this.rows.length;}
  getLastColumn(){return Math.max(0,...this.rows.map(row=>row.length));}
  getRange(...args){return new Range(this,...args);}
  getDataRange(){return this.getRange(1,1,Math.max(1,this.getLastRow()),Math.max(1,this.getLastColumn()));}
  appendRow(row){this.rows.push(row.slice());}
  setFrozenRows(){}
  deleteRow(row){this.rows.splice(row-1,1);}
}
const originalHeaders=['Timestamp','Source','Name','Phone','Email','Details','ID','Status','Archive','ArchivedAt'];
function backend(rows=[originalHeaders,['2026-10-21','Event Booking','Preview Visitor','+919999900000','','First visit','registration-1','Pending','','']]){
  const sheets=new Map([['Registrations',new Sheet(rows)]]);
  let counter=0, held=false;
  const context=vm.createContext({
    SpreadsheetApp:{getActiveSpreadsheet:()=>({getSheetByName:name=>sheets.get(name)||null,insertSheet:name=>{const sheet=new Sheet();sheets.set(name,sheet);return sheet;}})},
    Utilities:{getUuid:()=>`test-id-${++counter}`},
    LockService:{getScriptLock:()=>({waitLock:()=>{assert.equal(held,false);held=true;},releaseLock:()=>{held=false;}})},
    ContentService:{MimeType:{JSON:'application/json'},createTextOutput:text=>({text,setMimeType(){return this;}})}
  });
  let source=fs.readFileSync(path.join(__dirname,'../admin-tools/apps-script.gs'),'utf8');
  // Tests never use, transmit or print configured deployment credentials.
  for(const [name,value] of [['ADMIN_KEY','test-admin'],['MEDIA_KEY','test-media'],['WORSHIP_KEY','test-worship']])source=source.replace(new RegExp(`const ${name} = [^\\n]+;`),`const ${name} = '${value}';`);
  vm.runInContext(source,context);
  const decode=result=>JSON.parse(result.text);
  return {sheets, get:p=>decode(context.doGet({parameter:p})), post:p=>decode(context.doPost({postData:{contents:JSON.stringify(p)}})), unlocked:()=>!held};
}
test('unauthorized workflow writes neither migrate nor change sheets',()=>{
  const app=backend();
  assert.equal(app.post({action:'setFollowUp',key:'wrong',id:'registration-1'}).error,'unauthorized');
  assert.equal(app.post({action:'mediaPlanSave',key:'wrong',title:'Test'}).error,'unauthorized');
  assert.equal(app.sheets.get('Registrations').getLastColumn(),10);
  assert.equal(app.sheets.size,1);
});
test('registration migration appends follow-up fields and preserves original records',()=>{
  const app=backend(), before=app.sheets.get('Registrations').rows[1].slice();
  const data=app.get({key:'test-admin'});
  assert.equal(data.features.followUps,true);
  assert.equal(app.sheets.get('Registrations').getLastColumn(),15);
  assert.deepEqual(app.sheets.get('Registrations').rows[1].slice(0,10),before);
  assert.equal(data.data[0].Name,'Preview Visitor');
});
test('follow-ups persist, support completion, and reject stale revisions',()=>{
  const app=backend();
  const input={action:'setFollowUp',key:'test-admin',id:'registration-1',owner:'Preview Coordinator',due:'2026-10-23',note:'Call about the visit',status:'Open',rev:''};
  const first=app.post(input);assert.equal(first.ok,true);assert.ok(first.followUp.FollowUpRev);
  assert.equal(app.post({...input,note:'stale overwrite'}).error,'conflict');
  const done=app.post({...input,status:'Done',rev:first.followUp.FollowUpRev});assert.equal(done.followUp.FollowUpStatus,'Done');
  assert.equal(app.get({key:'test-admin'}).data[0].FollowUpNote,'Call about the visit');
  assert.equal(app.unlocked(),true);
});
test('follow-up validation rejects impossible dates and GET mutations',()=>{
  const app=backend();
  assert.equal(app.post({action:'setFollowUp',key:'test-admin',id:'registration-1',due:'2026-02-30'}).error,'invalid follow-up');
  assert.equal(app.get({action:'setFollowUp',key:'test-admin',id:'registration-1'}).error,'use POST');
  assert.equal(app.post({action:'setFollowUp',key:'test-admin',id:'registration-1',note:'x'.repeat(1001)}).error,'invalid follow-up');
  assert.equal(backend([originalHeaders]).post({action:'setFollowUp',key:'test-admin',id:'missing'}).error,'not found');
});
test('media planner advertises capability and leaves stock and monthly logs untouched',()=>{
  const app=backend();
  assert.equal(app.get({action:'mediaLogin',key:'test-media'}).version,5);
  assert.deepEqual(app.get({action:'mediaPlanList',key:'test-media'}).tasks,[]);
  assert.equal(app.sheets.has('MediaPlan'),false);
  const first=app.post({action:'mediaPlanSave',key:'test-media',title:'Sunday reel',type:'Reel',owner:'Preview Editor',due:'2026-10-24',status:'In progress',notes:'Use sermon footage'});
  assert.equal(first.ok,true);assert.equal(first.task.owner,'Preview Editor');
  assert.equal(app.sheets.get('MediaPlan').getLastRow(),2);
  assert.equal(app.sheets.has('MediaWork'),false);assert.equal(app.sheets.has('MediaItems'),false);
  const changed=app.post({action:'mediaPlanSave',key:'test-media',...first.task,id:first.task.id,rev:first.task.rev,title:'Updated reel',due:'2026-10-25',status:'Done'});
  assert.equal(changed.task.status,'Done');assert.equal(app.sheets.get('MediaPlan').getLastRow(),2);
  assert.equal(app.post({action:'mediaPlanSave',key:'test-media',...first.task}).error,'conflict');
  assert.equal(app.unlocked(),true);
});
test('planner rejects invalid assignments, stale targets and GET writes',()=>{
  const app=backend(), input={action:'mediaPlanSave',key:'test-media',title:'Test',type:'Reel',due:'2026-10-24'};
  assert.equal(app.get(input).error,'use POST');
  assert.equal(app.post({...input,due:'2026-13-01'}).error,'invalid assignment');
  assert.equal(app.post({...input,title:'   '}).error,'invalid assignment');
  assert.equal(app.post({...input,status:'Invented status'}).error,'invalid assignment');
  assert.equal(app.post({...input,id:'missing',rev:''}).error,'not found');
  assert.equal(app.sheets.has('MediaPlan'),false);
});
test('existing public registrations still reach the original log',()=>{
  const app=backend();
  assert.equal(app.post({source:'Event Booking',name:'Another Preview Visitor',phone:'+919999900001',details:'Sunday'}).ok,true);
  const records=app.get({key:'test-admin'}).data;
  assert.equal(records.length,2);assert.equal(records[1].Name,'Another Preview Visitor');assert.equal(records[1].Status,'Pending');
});
test('editing or cancelling an assignment preserves other team assignments',()=>{
  const app=backend(), input={action:'mediaPlanSave',key:'test-media',title:'First reel',type:'Reel',due:'2026-10-24'};
  const first=app.post(input).task;
  const second=app.post({...input,title:'Second reel',owner:'Other editor'}).task;
  assert.equal(app.post({...input,id:first.id,rev:first.rev,status:'Cancelled'}).task.status,'Cancelled');
  const list=app.get({action:'mediaPlanList',key:'test-media'}).tasks;
  assert.equal(list.length,2);assert.deepEqual(list.find(t=>t.id===second.id),second);
});
