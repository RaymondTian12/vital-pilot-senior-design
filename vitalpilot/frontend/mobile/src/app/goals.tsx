import { useCallback, useState } from "react";
import { Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { api } from "@/services/api";
import { Button, Card, Field, Heading, Screen, ui } from "@/components/design/ui";
// min/max mirror backend/routers/goals.py's GoalsUpdate bounds -- keep in sync.
const fields = [
 ["SLEEP", "Sleep goal (hours)", 1, 16, "Most adults: 7–9 hours"],
 ["WATER_INTAKE", "Water goal (cups)", 1, 20, "Common guidance: about 8 cups/day"],
 ["PHYSICAL_ACTIVITY", "Activity goal (steps)", 500, 50000, "Common goal: 10,000 steps/day"],
 ["PEAK_FLOW_RATE", "Established peak-flow personal best (L/min)", 30, 900, "Typical adult range: 400–700 L/min — use your own measured value, not this range"],
] as const;
export default function Goals() {
 const [values,setValues]=useState<Record<string,string>>({});
 const [loading,setLoading]=useState(true), [saving,setSaving]=useState(false), [error,setError]=useState(""), [message,setMessage]=useState("");
 const [retry,setRetry]=useState(0);
 useFocusEffect(useCallback(()=>{ let active=true; setLoading(true); api.goals().then(result=>{if(active) {setValues(Object.fromEntries(Object.entries(result.goals).map(([k,v])=>[k,String(v)])));setError("");}}).catch(()=>{if(active)setError("Couldn’t load goals. Try again.");}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[retry]));
 async function save(){
  setError("");setMessage("");const payload:Record<string,number>={};
  for(const [key,label,min,max] of fields){ const text=values[key]?.trim();if(!text)continue; const value=Number(text);if(!/^(?:\d+(?:\.\d{1,2})?|\.\d{1,2})$/.test(text)||!Number.isFinite(value)||value<min||value>max||(["PHYSICAL_ACTIVITY","PEAK_FLOW_RATE"].includes(key)&&!Number.isInteger(value))){setError(`${label}: enter a ${key==="PHYSICAL_ACTIVITY"||key==="PEAK_FLOW_RATE"?"whole number":"number"} from ${min} to ${max}.`);return;}payload[key]=value;}
  if(!Object.keys(payload).length){setError("Enter at least one goal.");return;}
  setSaving(true);try{await api.updateGoals(payload);setMessage("Goals saved. New assessments will use these settings.");}catch{setError("Couldn’t save goals. Your edits are still here.");}finally{setSaving(false);}
 }
 return <Screen back><Heading title="Goals & personal best" subtitle="Update your personal tracking settings."/><Card>
 <Text style={ui.body}>Peak-flow personal best should be an established value from your care plan, not an arbitrary target. Saved readings retain their original assessment context.</Text>
 {loading?<Text style={ui.body}>Loading goals…</Text>:fields.map(([key,label,,,hint])=><View key={key} style={{gap:4}}><Text style={ui.small}>{hint}</Text><Field label={label} value={values[key]||""} editable={!saving} keyboardType={key==="PHYSICAL_ACTIVITY"||key==="PEAK_FLOW_RATE"?"number-pad":"decimal-pad"} onChangeText={v=>{setValues(current=>({...current,[key]:v}));setMessage("");}}/></View>)}
 {!!error&&<Text accessibilityRole="alert" style={ui.body}>{error}</Text>}{!!message&&<Text accessibilityLiveRegion="polite" style={ui.body}>{message}</Text>}
 <Button disabled={loading||saving} onPress={()=>void save()}>{saving?"Saving…":"Save goals"}</Button><Button secondary disabled={saving} onPress={()=>setRetry(v=>v+1)}>Reload saved goals</Button>
 </Card></Screen>;
}
