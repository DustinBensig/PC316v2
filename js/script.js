const L=localStorage,S=sessionStorage,$=s=>document.querySelector(s);
const get=(k,d)=>{try{const v=L.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},set=(k,v)=>L.setItem(k,JSON.stringify(v));
const page=document.body.dataset.page,go=p=>location.href=p+'.html',flash=m=>S.setItem('ee_flash',m);
const TYPES=['Enrollment Assistance','Document Submission','Payment / Cashier','Subject Advising','Records Request'];
const TIMES=['08:00 AM','09:00 AM','10:00 AM','11:00 AM','01:00 PM','02:00 PM','03:00 PM','04:00 PM'];
const today=()=>new Date(Date.now()-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,10);
const fd=d=>new Date(d+'T00:00').toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',year:'numeric'});
const to24=t=>{const h=+t.slice(0,2)%12+(t.endsWith('PM')?12:0);return String(h).padStart(2,'0')+t.slice(2,5)};
const when=a=>new Date(a.date+'T'+to24(a.time)+':00');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
if(!get('ee_users'))set('ee_users',[{name:'Juan Dela Cruz',sid:'2024-00123',email:'juan@student.edu',pw:'demo1234',contact:'0917 123 4567',program:'BS Information Technology',year:'2nd Year',enrolled:'2024-06-10'}]);
document.documentElement.dataset.theme=get('ee_theme','light');
const users=()=>get('ee_users',[]),me=()=>users().find(u=>u.sid===get('ee_session')),appts=()=>get('ee_appts',[]);
const mine=()=>appts().filter(a=>a.sid===get('ee_session'));
const isPast=a=>a.status==='Completed'||when(a)<new Date();
function toast(m,bad){const t=document.createElement('div');t.className='toast'+(bad?' e':'');t.textContent=m;document.body.append(t);setTimeout(()=>t.remove(),3200)}
function modal(html){const m=document.createElement('div');m.className='modal';m.innerHTML='<div class="card">'+html+'</div>';m.onclick=e=>{if(e.target===m)m.remove()};document.body.append(m);return m}
function seed(sid){const a=appts(),d=n=>{const x=new Date();x.setDate(x.getDate()-n);return x.toISOString().slice(0,10)};
 if(a.some(x=>x.sid===sid))return;set('ee_appts',a.concat([{id:'s'+sid+1,sid,type:'Enrollment Assistance',date:d(21),time:'09:00 AM',queue:'Q-004',status:'Completed'},{id:'s'+sid+2,sid,type:'Document Submission',date:d(9),time:'02:00 PM',queue:'Q-011',status:'Completed'}]))}
function taken(date,t,ex){const x=new Date(),n=today();
 if(date===n&&when({date,time:t})<x)return true;
 if([...date+t].reduce((s,c)=>s+c.charCodeAt(0)*7,0)%4===0)return true;
 return appts().some(a=>a.date===date&&a.time===t&&a.status!=='Cancelled'&&a.id!==ex)}
const nextQueue=d=>'Q-'+String(appts().filter(a=>a.date===d).length+1).padStart(3,'0');
function fld(id,l,t='text',v='',x=''){return `<label for="${id}">${l}</label><input id="${id}" type="${t}" value="${esc(v)}" ${x}><div class="err" id="e-${id}"></div>`}
function bad(id,m){const e=$('#e-'+id);if(e)e.textContent=m;return !m}
const clear=()=>document.querySelectorAll('.err').forEach(e=>e.textContent='');
const NAV=[['dashboard','🏠','Dashboard'],['book-appointment','📅','Book Appointment'],['my-schedule','🗓️','My Schedule'],['enrollment','🎓','Enrollment Details'],['profile','👤','Profile'],['settings','⚙️','Settings']];
function shell(h){const on={'appointment-summary':'book-appointment',confirmation:'book-appointment',reschedule:'my-schedule','reschedule-confirmation':'my-schedule'}[page]||page;
 return `<div class="shell"><aside class="side" id="side"><div class="logo">Enroll<span>Ease</span></div>${NAV.map(n=>`<a href="${n[0]}.html" class="${n[0]===on?'on':''}">${n[1]} ${n[2]}</a>`).join('')}<a href="#" id="lo">🚪 Logout</a></aside>
 <main class="main"><div class="top"><button class="burger" id="bg" aria-label="Menu">☰</button><b class="logo">EnrollEase</b></div>${h}</main></div>`}
function picker(ex,cb){const d=$('#date'),box=$('#slots');d.min=today();
 const draw=()=>{cb(null,null);if(!d.value){box.innerHTML='<p class="muted">Pick a date to see available times.</p>';return}
  const w=new Date(d.value+'T00:00').getDay();
  if(d.value<today()||w===0||w===6){box.innerHTML='<p class="err">Appointments are available Monday to Friday, starting today. Choose another date.</p>';return}
  box.innerHTML=TIMES.map(t=>{const o=taken(d.value,t,ex);return `<button type="button" class="slot ${o?'off':''}" ${o?'disabled':''}>${t}<small>${o?'Unavailable':'Available'}</small></button>`}).join('');
  box.querySelectorAll('.slot:not(.off)').forEach(b=>b.onclick=()=>{box.querySelectorAll('.slot').forEach(x=>x.classList.remove('sel'));b.classList.add('sel');cb(d.value,b.firstChild.textContent)})};
 d.onchange=draw;draw()}
const dl=(o)=>'<dl>'+Object.entries(o).map(([k,v])=>`<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')+'</dl>';
const PUB=['index','login','register'];
if(!PUB.includes(page)&&!me()){flash('Please log in to continue.');go('login');var STOP=1}
if(PUB.slice(1).includes(page)&&me()){go('dashboard');var STOP=1}
const P={};
P.index={r:()=>`<div class="hero"><div class="card"><svg width="120" height="110" viewBox="0 0 120 110" aria-hidden="true"><rect x="14" y="26" width="92" height="76" rx="12" fill="#dbeafe" stroke="#1d4ed8" stroke-width="4"/><rect x="14" y="26" width="92" height="22" rx="12" fill="#1d4ed8"/><path d="M60 4 22 18l38 14 38-14z" fill="#3b82f6"/><circle cx="40" cy="70" r="7" fill="#1d4ed8"/><circle cx="60" cy="70" r="7" fill="#93c5fd"/><circle cx="80" cy="70" r="7" fill="#93c5fd"/><path d="m34 90 6 6 12-12" stroke="#16a34a" stroke-width="5" fill="none"/></svg>
 <div class="logo">Enroll<span>Ease</span></div><h2>Smarter Enrollment. Brighter Future.</h2><p>Welcome! Book your enrollment appointment, get your queue number, and skip the long lines.</p>
 <a class="btn" href="register.html">Get Started</a><p>Already have an account? <a href="login.html">Login</a></p></div></div>`};
P.login={r:()=>`<div class="auth"><form class="card" id="f" novalidate><div class="logo center">Enroll<span>Ease</span></div><h2 class="center">Welcome back</h2><p class="muted center">Demo: 2024-00123 / demo1234</p>
 ${fld('id','Email Address or Student ID')}${fld('pw','Password','password')}<a href="#" id="fp">Forgot password?</a><br><br><button class="btn" style="width:100%">Login</button><p class="center">No account yet? <a href="register.html">Register</a></p></form></div>`,
 i(){$('#f').onsubmit=e=>{e.preventDefault();clear();const v=$('#id').value.trim(),p=$('#pw').value;let ok=true;
  if(!v)ok=bad('id','Enter your email or student ID.');if(!p)ok=bad('pw','Enter your password.');if(!ok)return;
  const u=users().find(u=>u.email.toLowerCase()===v.toLowerCase()||u.sid===v);
  if(!u)return bad('id','No account found for that email or student ID.');
  if(u.pw!==p)return bad('pw','Incorrect password. Try again.');
  set('ee_session',u.sid);seed(u.sid);flash('Welcome back, '+u.name.split(' ')[0]+'!');go('dashboard')};
  $('#fp').onclick=e=>{e.preventDefault();const m=modal(`<h3>Reset password</h3><p class="muted">Enter your email and we'll send reset instructions.</p>${fld('fe','Email Address','email')}<button class="btn" id="fs">Send link</button>`);
   m.querySelector('#fs').onclick=()=>{const v=m.querySelector('#fe').value.trim();if(!/^\S+@\S+\.\S+$/.test(v))return bad('fe','Enter a valid email address.');m.remove();toast('Reset link sent to '+v)}}}};
P.register={r:()=>`<div class="auth"><form class="card" id="f" novalidate><div class="logo center">Enroll<span>Ease</span></div><h2 class="center">Create Account</h2>
 ${fld('n','Full Name')}${fld('s','Student ID','text','','placeholder="2024-00000"')}${fld('em','Email Address','email')}${fld('pw','Password','password')}${fld('pc','Confirm Password','password')}
 <button class="btn" style="width:100%">Create Account</button><p class="center">Have an account? <a href="login.html">Login</a></p></form></div>`,
 i(){$('#f').onsubmit=e=>{e.preventDefault();clear();const n=$('#n').value.trim(),s=$('#s').value.trim(),em=$('#em').value.trim(),p=$('#pw').value,c=$('#pc').value,us=users();let ok=true;
  if(n.length<3)ok=bad('n','Enter your full name.');
  if(!/^[\w-]{5,}$/.test(s))ok=bad('s','Student ID must be at least 5 letters, numbers or dashes.');else if(us.some(u=>u.sid===s))ok=bad('s','This Student ID is already registered.');
  if(!/^\S+@\S+\.\S+$/.test(em))ok=bad('em','Enter a valid email address.');else if(us.some(u=>u.email.toLowerCase()===em.toLowerCase()))ok=bad('em','This email is already registered.');
  if(p.length<8)ok=bad('pw','Password must be at least 8 characters.');if(c!==p)ok=bad('pc','Passwords do not match.');if(!ok)return;
  us.push({name:n,sid:s,email:em,pw:p,contact:'',program:'BS Information Technology',year:'1st Year',enrolled:today()});set('ee_users',us);seed(s);flash('Account created! Please log in.');go('login')}}};
P.dashboard={r(){const u=me(),nx=mine().filter(a=>!isPast(a)&&a.status!=='Cancelled').sort((a,b)=>when(a)-when(b))[0];
 const T=(h,i,t,x='')=>`<a class="card tile" href="${h}"><div class="ic">${i}</div><b>${t}</b>${x}</a>`;
 return shell(`<div class="banner"><p style="margin:0;opacity:.85">Welcome back,</p><h1>${esc(u.name)}</h1><p style="margin:0">${nx?`Next appointment: ${fd(nx.date)} at ${nx.time} (${nx.type})`:'You have no upcoming appointments.'}</p></div>
 <div class="grid">${T('book-appointment.html','📅','Book Appointment','<p class="muted">Reserve a time slot</p>')}${T('my-schedule.html','🗓️','My Schedule','<p class="muted">Upcoming and past</p>')}
 ${T('my-schedule.html','🎟️','Queue Number',nx?`<div class="q">${nx.queue}</div>`:'<p class="muted">No active queue</p>')}${T('enrollment.html','🎓','Enrollment Details','<p class="muted">Status and records</p>')}
 ${T('profile.html','👤','Profile','<p class="muted">Your information</p>')}${T('settings.html','⚙️','Settings','<p class="muted">Preferences</p>')}<a class="card tile" href="#" id="lo2"><div class="ic">🚪</div><b>Logout</b></a></div>`)},
 i(){$('#lo2').onclick=e=>{e.preventDefault();logout()}}};
P['book-appointment']={r:()=>shell(`<h1>Book Appointment</h1><div class="card"><label for="type">Appointment type</label><select id="type">${TYPES.map(t=>`<option>${t}</option>`).join('')}</select>
 <label for="date">Appointment date</label><input type="date" id="date"><label>Available times</label><div id="slots"></div><div class="err" id="e-b"></div><button class="btn" id="go" disabled>Continue</button></div>`),
 i(){let D,T;picker(null,(d,t)=>{D=d;T=t;$('#go').disabled=!t});$('#go').onclick=()=>{if(!D||!T)return bad('b','Select a date and an available time.');S.setItem('ee_draft',JSON.stringify({type:$('#type').value,date:D,time:T}));go('appointment-summary')}}};
P['appointment-summary']={r(){const d=JSON.parse(S.getItem('ee_draft')||'null');if(!d){go('book-appointment');return ''}
 return shell(`<h1>Appointment Summary</h1><div class="card">${dl({'Appointment type':d.type,Date:fd(d.date),Time:d.time,'Queue number':nextQueue(d.date)})}
 <h3 class="sec">Important instructions</h3><ul class="muted"><li>Arrive 15 minutes before your time.</li><li>Bring a valid school ID and printed requirements.</li><li>Show your queue number at the registrar's desk.</li><li>Missed slots may be released to other students.</li></ul>
 <div class="row"><button class="btn alt" id="bk">Back</button><button class="btn" id="cf">Confirm Appointment</button></div></div>`)},
 i(){const d=JSON.parse(S.getItem('ee_draft'));$('#bk').onclick=()=>go('book-appointment');
  $('#cf').onclick=()=>{if(taken(d.date,d.time)){toast('That slot was just taken. Choose another.',1);return setTimeout(()=>go('book-appointment'),1200)}
   const a={id:'a'+Date.now(),sid:get('ee_session'),type:d.type,date:d.date,time:d.time,queue:nextQueue(d.date),status:'Confirmed'};set('ee_appts',appts().concat(a));set('ee_last',a.id);S.removeItem('ee_draft');go('confirmation')}}};
const last=()=>appts().find(a=>a.id===get('ee_last'));
P.confirmation={r(){const a=last();if(!a){go('dashboard');return ''}return shell(`<div class="card big"><div class="check">✓</div><h1>Appointment Confirmed!</h1>${dl({Date:fd(a.date),Time:a.time,'Queue number':a.queue})}<a class="btn" href="dashboard.html">Back to Dashboard</a></div>`)}};
P['my-schedule']={r(){const m=mine().filter(a=>a.status!=='Cancelled'),up=m.filter(a=>!isPast(a)).sort((a,b)=>when(a)-when(b)),pa=m.filter(isPast).sort((a,b)=>when(b)-when(a));
 const row=(a,u)=>`<div class="card ap"><div><b>${a.type}</b><div class="muted">${fd(a.date)} · ${a.time}${u?' · Queue '+a.queue:''}</div></div><span class="badge ${u?(a.status==='Rescheduled'?'p':''):'d'}">${isPast(a)&&a.status!=='Completed'?'Completed':a.status}</span>${u?`<div class="row"><button class="btn sm alt" data-v="${a.id}">View Details</button><button class="btn sm" data-r="${a.id}">Reschedule</button></div>`:''}</div>`;
 return shell(`<h1>My Schedule</h1><h2>Upcoming Appointments</h2>${up.map(a=>row(a,1)).join('')||'<div class="card muted">Nothing booked yet. <a href="book-appointment.html">Book an appointment</a></div>'}<h2 class="sec">Past Appointments</h2>${pa.map(a=>row(a,0)).join('')||'<div class="card muted">No past appointments.</div>'}`)},
 i(){document.querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>{const a=appts().find(x=>x.id===b.dataset.v);const m=modal(`<h3>Appointment Details</h3>${dl({Type:a.type,Date:fd(a.date),Time:a.time,'Queue number':a.queue,Status:a.status})}<br><button class="btn" id="x">Close</button>`);m.querySelector('#x').onclick=()=>m.remove()});
  document.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>{S.setItem('ee_resched',b.dataset.r);go('reschedule')})}};
P.reschedule={r(){const a=appts().find(x=>x.id===S.getItem('ee_resched'));if(!a){go('my-schedule');return ''}
 return shell(`<h1>Reschedule Appointment</h1><div class="card"><h3>Current appointment</h3>${dl({Type:a.type,Date:fd(a.date),Time:a.time,'Queue number':a.queue})}</div>
 <div class="card sec"><label for="date">New date</label><input type="date" id="date"><label>New available time</label><div id="slots"></div><div class="row"><button class="btn alt" id="cn">Cancel</button><button class="btn" id="ok" disabled>Confirm New Schedule</button></div></div>`)},
 i(){const id=S.getItem('ee_resched');let D,T;picker(id,(d,t)=>{D=d;T=t;$('#ok').disabled=!t});$('#cn').onclick=()=>{S.removeItem('ee_resched');go('my-schedule')};
  $('#ok').onclick=()=>{const all=appts(),a=all.find(x=>x.id===id);a.date=D;a.time=T;a.queue=nextQueue(D);a.status='Rescheduled';set('ee_appts',all);set('ee_last',id);S.removeItem('ee_resched');go('reschedule-confirmation')}}};
P['reschedule-confirmation']={r(){const a=last();if(!a){go('dashboard');return ''}return shell(`<div class="card big"><div class="check">✓</div><h1>Appointment Rescheduled!</h1>${dl({'Updated date':fd(a.date),'Updated time':a.time,Type:a.type,'Queue number':a.queue})}<a class="btn" href="dashboard.html">Back to Dashboard</a></div>`)}};
P.enrollment={r(){const u=me(),y=new Date(u.enrolled+'T00:00').getFullYear();return shell(`<h1>Enrollment Details</h1><div class="card">${dl({'Student ID':u.sid,'Student Name':u.name,Program:u.program,'Year Level':u.year,'Enrollment Status':'Officially Enrolled','Enrollment Date':fd(u.enrolled),'Academic Year':y+'–'+(y+1)})}</div>`)}};
P.profile={r(){const u=me();return shell(`<h1>Profile</h1><form class="card" id="f">${fld('n','Full Name','text',u.name,'disabled')}${fld('s','Student ID','text',u.sid,'disabled')}${fld('em','Email','email',u.email,'disabled')}${fld('c','Contact Number','tel',u.contact,'disabled')}${fld('p','Program','text',u.program,'disabled')}${fld('y','Year Level','text',u.year,'disabled')}
 <div class="row"><button type="button" class="btn alt" id="ed">Edit Profile</button><button class="btn" id="sv" disabled>Save Changes</button></div></form>`)},
 i(){const ed=['n','em','c','p','y'];$('#s').disabled=true;$('#ed').onclick=()=>{ed.forEach(i=>$('#'+i).disabled=false);$('#sv').disabled=false;$('#n').focus()};
  $('#f').onsubmit=e=>{e.preventDefault();clear();let ok=true;const v=i=>$('#'+i).value.trim();
   if(v('n').length<3)ok=bad('n','Enter your full name.');if(!/^\S+@\S+\.\S+$/.test(v('em')))ok=bad('em','Enter a valid email.');if(v('c')&&!/^[\d\s+-]{7,}$/.test(v('c')))ok=bad('c','Enter a valid contact number.');if(!ok)return;
   const us=users(),u=us.find(x=>x.sid===get('ee_session'));Object.assign(u,{name:v('n'),email:v('em'),contact:v('c'),program:v('p'),year:v('y')});set('ee_users',us);ed.forEach(i=>$('#'+i).disabled=true);$('#sv').disabled=true;toast('Profile saved.')}}};
P.settings={r(){const n=get('ee_notif',{email:1,sms:0,remind:1}),u=me(),sw=(k,t)=>`<div class="row sp" style="margin:10px 0"><span>${t}</span><span class="sw"><input type="checkbox" data-n="${k}" ${n[k]?'checked':''}><i></i></span></div>`;
 return shell(`<h1>Settings</h1><div class="card"><h3>Notifications</h3>${sw('email','Email notifications')}${sw('sms','SMS notifications')}${sw('remind','Appointment reminders')}</div>
 <div class="card sec"><h3>Appearance</h3><div class="row sp"><span>Dark mode</span><span class="sw"><input type="checkbox" id="dm" ${get('ee_theme')==='dark'?'checked':''}><i></i></span></div></div>
 <div class="card sec"><h3>Account</h3>${dl({Name:u.name,'Student ID':u.sid,Email:u.email})}</div>
 <form class="card sec" id="f"><h3>Change password</h3>${fld('o','Current password','password')}${fld('nw','New password','password')}${fld('cf','Confirm new password','password')}<button class="btn">Update Password</button></form>
 <div class="sec"><button class="btn alt" id="lo3">Logout</button></div>`)},
 i(){document.querySelectorAll('[data-n]').forEach(c=>c.onchange=()=>{const n=get('ee_notif',{});n[c.dataset.n]=c.checked?1:0;set('ee_notif',n);toast('Notification settings saved.')});
  $('#dm').onchange=e=>{const t=e.target.checked?'dark':'light';set('ee_theme',t);document.documentElement.dataset.theme=t};$('#lo3').onclick=logout;
  $('#f').onsubmit=e=>{e.preventDefault();clear();const us=users(),u=us.find(x=>x.sid===get('ee_session')),o=$('#o').value,n=$('#nw').value;let ok=true;
   if(o!==u.pw)ok=bad('o','Current password is incorrect.');if(n.length<8)ok=bad('nw','Use at least 8 characters.');if($('#cf').value!==n)ok=bad('cf','Passwords do not match.');if(!ok)return;
   u.pw=n;set('ee_users',us);e.target.reset();toast('Password updated.')}}};
function logout(){L.removeItem('ee_session');flash('You have been logged out.');go('login')}
const pg=P[page];if(pg&&!STOP){$('#app').innerHTML=pg.r();if(pg.i)pg.i();
 const bg=$('#bg');if(bg)bg.onclick=()=>$('#side').classList.toggle('open');const lo=$('#lo');if(lo)lo.onclick=e=>{e.preventDefault();logout()};
 const f=S.getItem('ee_flash');if(f){S.removeItem('ee_flash');toast(f)}}
