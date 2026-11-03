import { useCallback, useState } from "react";
import { Text, View } from "react-native";
import { useFocusEffect, Redirect } from "expo-router";
import { useAuth } from "@/context/auth-context";
import { api } from "@/services/api";
import { Button, Card, Chip, Heading, Screen, ui } from "@/components/design/ui";
import { vitals, type Metric } from "@/components/design/vitals-data";
import { readingValue } from "@/services/vital-readings";
import type { SavedMetricReading } from "@/types/vitalpilot";
type Person = {user_id:number;firstname:string;lastname:string;role?:string};
type Provider = {provider_id:number;firstname:string;lastname:string;specialty:string;allowed:boolean};
export default function Portal() {
 const {user,signOut}=useAuth();
 const [people,setPeople]=useState<Person[]>([]),[providers,setProviders]=useState<Provider[]>([]);
 const [patient,setPatient]=useState<Person|null>(null),[metric,setMetric]=useState<Metric>("Blood Pressure"),[records,setRecords]=useState<SavedMetricReading[]>([]);
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[retry,setRetry]=useState(0),[confirm,setConfirm]=useState<number|null>(null),[more,setMore]=useState(false);
 useFocusEffect(useCallback(()=>{let active=true;setBusy(true);setError("");setRecords([]);setPeople([]);
 async function load(){try{
 if(user?.role==="patient"){const data=await api.sharing();if(active)setProviders(data.providers);}
 else if(user?.role==="admin"){const data=await api.adminUsers();if(active){setPeople(data.users);setMore(data.users.length===50);}}
 else if(user?.role==="provider"){if(patient){const data=await api.patientMetrics(patient.user_id,vitals[metric].type);if(active){setRecords(data.records);setMore(data.records.length===20);}}else{const data=await api.patients();if(active)setPeople(data.patients);}}
 }catch{if(active)setError("Couldn’t load this view. Permission may have changed. Try again.");}finally{if(active)setBusy(false);}}
 void load();return()=>{active=false;};},[user?.user_id,user?.role,patient,metric,retry]));
 if(!user)return <Redirect href="/signin"/>;
 async function sharing(p:Provider){setBusy(true);setError("");try{await api.setSharing(p.provider_id,!p.allowed);setConfirm(null);setRetry(v=>v+1);}catch{setError("Sharing could not be changed. Refresh to verify the current permission.");setBusy(false);}}
 async function loadMore(){setBusy(true);try{if(user?.role==="admin"){const data=await api.adminUsers(people.length);setPeople(current=>[...current,...data.users]);setMore(data.users.length===50);}else if(patient){const data=await api.patientMetrics(patient.user_id,vitals[metric].type,records.length);setRecords(current=>[...current,...data.records]);setMore(data.records.length===20);}}catch{setError("Couldn’t load more. Refresh to check permission.");setRecords([]);}finally{setBusy(false);}}
 return <Screen back><Heading title={user.role==="patient"?"Doctor sharing":user.role==="provider"?"Doctor portal":"Admin portal"}/>
 <Text style={ui.body}>{user.role==="patient"?"Choose registered providers who may view your saved health readings. This shares all metric histories; you can revoke future access here. Previously viewed information cannot be recalled.":user.role==="provider"?"Only patients who explicitly granted access appear here. Records are read-only.":"Read-only account directory. Health records and role editing are not available here."}</Text>
 {!!error&&<Text accessibilityRole="alert" style={ui.body}>{error}</Text>}{busy&&<Text accessibilityLiveRegion="polite" style={ui.body}>Loading…</Text>}
 <Button secondary disabled={busy} onPress={()=>setRetry(v=>v+1)}>Refresh</Button>
 {user.role==="patient"&&providers.map(p=><Card key={p.provider_id}><Text style={ui.heading}>{p.firstname} {p.lastname}</Text><Text style={ui.body}>{p.specialty}</Text><Text style={ui.small}>{p.allowed?"Access granted":"No access"}</Text>{confirm===p.provider_id?<><Text style={ui.body}>Allow this provider to view all your saved metric histories?</Text><Button disabled={busy} onPress={()=>void sharing(p)}>Confirm sharing</Button><Button secondary disabled={busy} onPress={()=>setConfirm(null)}>Cancel</Button></>:<Button disabled={busy} onPress={()=>p.allowed?void sharing(p):setConfirm(p.provider_id)}>{p.allowed?"Revoke access":"Share readings"}</Button>}</Card>)}
 {user.role==="provider"&&patient&&<><Button disabled={busy} secondary onPress={()=>{setRecords([]);setPatient(null);}}>Back to patients</Button><Text style={ui.heading}>{patient.firstname} {patient.lastname}</Text><View style={[ui.row,{flexWrap:"wrap"}]}>{(Object.keys(vitals) as Metric[]).map(name=><Chip key={name} selected={name===metric} onPress={()=>{if(!busy){setRecords([]);setMetric(name);}}}>{name}</Chip>)}</View>{records.map(r=><Card key={r.log_id}><Text style={ui.heading}>{readingValue(r)} {vitals[metric].unit}</Text><Text style={ui.small}>{new Date(r.recorded_at).toLocaleString()}</Text></Card>)}</>}
 {people.map(p=><Card key={p.user_id}><Text style={ui.heading}>{p.firstname} {p.lastname}</Text>{p.role&&<Text style={ui.body}>{p.role}</Text>}{user.role==="provider"&&<Button disabled={busy} onPress={()=>setPatient(p)}>View readings</Button>}</Card>)}
 {!busy&&!error&&!(user.role==="patient"?providers.length:patient?records.length:people.length)&&<Text style={ui.body}>No records available for this view.</Text>}
 {more&&(user.role==="admin"||patient)&&<Button disabled={busy} onPress={()=>void loadMore()}>Load more</Button>}
 {user.role!=="patient"&&<Button secondary disabled={busy} onPress={()=>void signOut()}>Sign out</Button>}
 </Screen>;
}
