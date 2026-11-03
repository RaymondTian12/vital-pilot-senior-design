import { ReportExports } from "@/components/design/report-exports";
import { useCallback, useState } from "react";
import { Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { api } from "@/services/api";
import { summaryWindow, summaryValue, type DailySummaryResponse } from "@/services/daily-summary";
import { vitals, type Metric } from "@/components/design/vitals-data";
import { Button, Card, Chip, Heading, Screen, ui } from "@/components/design/ui";
import { Sparkline } from "@/components/design/charts";
import { VitalPilotColors as C } from "@/constants/vitalpilot";
export default function Reports(){
 const [days,setDays]=useState(30),[data,setData]=useState<DailySummaryResponse|null>(null),[error,setError]=useState(""),[loading,setLoading]=useState(false),[retry,setRetry]=useState(0);
 const router=useRouter();
 useFocusEffect(useCallback(()=>{let active=true;setLoading(true);setError("");setData(null);const window=summaryWindow();const start=new Date();start.setDate(start.getDate()-days+1);start.setHours(0,0,0,0);
 api.metricReport({...window,start_at:start.toISOString()}).then(result=>{if(active)setData(result);}).catch(()=>{if(active)setError("Your report couldn’t be loaded. Try again.");}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[days,retry]));
 return <Screen><Heading title="Health reports" subtitle="Your saved measurements over time."/><View style={[ui.row,{flexWrap:"wrap"}]}>{[7,30,90].map(n=><Chip key={n} selected={n===days} onPress={()=>setDays(n)}>{n} days</Chip>)}</View>
 <Text style={ui.small}>Missing days are not zero readings. Trends describe recorded values, not diagnoses or a guarantee of health. Habit charts use the latest total saved for each local day.</Text>
 {loading&&<Text accessibilityLiveRegion="polite" style={ui.body}>Preparing your report…</Text>}{!!error&&<Text accessibilityRole="alert" style={ui.body}>{error}</Text>}
 <Button secondary disabled={loading} onPress={()=>setRetry(v=>v+1)}>Refresh report</Button>
 {data&&<Text style={ui.small}>{new Date(data.start_at).toLocaleDateString()} – {new Date(new Date(data.end_at).getTime()-1).toLocaleDateString()} · {data.records.length} loaded readings</Text>}
 {data&&(Object.keys(vitals) as Metric[]).map(name=>{
 const config=vitals[name];const all=data.records.filter(r=>r.metric_type===config.type).sort((a,b)=>Date.parse(a.recorded_at)-Date.parse(b.recorded_at)||a.log_id-b.log_id);
 const habit=["SLEEP","PHYSICAL_ACTIVITY","WATER_INTAKE"].includes(config.type);
 const daily=new Map<string,typeof all[number]>();if(habit)all.forEach(r=>daily.set(new Date(r.recorded_at).toLocaleDateString(),r));
 const readings=habit?[...daily.values()]:all;const latest=readings[readings.length-1];
 const values=readings.map(r=>Number(summaryValue(r).split('/')[0]));
 return <Card key={name}><Text style={ui.heading}>{name}</Text>{!latest?<Text style={ui.body}>No saved readings in this period.</Text>:<>
 <Text style={ui.title}>{summaryValue(latest)} {config.unit}</Text><Text style={ui.small}>Latest · {new Date(latest.recorded_at).toLocaleString()}</Text>
 <Text style={ui.small}>{readings.length} {habit?"days with entries":"readings"} · Range {Math.min(...values)}–{Math.max(...values)} {config.unit}{config.type==="BLOOD_PRESSURE"?" (systolic)":""}</Text>
 {data.truncated_metrics.includes(config.type)&&<Text style={ui.body}>Some readings were omitted because the report reached its limit. Statistics describe loaded readings only.</Text>}
 {habit?<View style={{gap:8}}><Text style={ui.small}>Last seven logged days · gaps may include missing days</Text><View style={[ui.row,{alignItems:"flex-end",gap:6}]}>{readings.slice(-7).map(r=>{const value=Number(summaryValue(r));return <View key={r.log_id} style={{flex:1,gap:4,alignItems:"center"}}><Text style={ui.small}>{value}</Text><View style={{width:"100%",height:Math.max(2,value/Math.max(1,...values)*100),backgroundColor:C.primary,borderRadius:4}}/><Text style={[ui.small,{fontSize:10}]}>{new Date(r.recorded_at).toLocaleDateString(undefined,{month:"numeric",day:"numeric"})}</Text></View>;})}</View></View>:values.length>1?<><Text style={ui.small}>Oldest → newest · recorded observations, spaced evenly</Text><Sparkline values={values} label={`${name}${config.type==="BLOOD_PRESSURE"?" systolic":""} in ${config.unit}`}/>{config.type==="BLOOD_PRESSURE"&&<><Text style={ui.small}>Diastolic</Text><Sparkline values={readings.map(r=>r.metric_type==="BLOOD_PRESSURE"?r.diastolic_mmhg:0)} label="Diastolic in mmHg" color={C.textSecondary}/></>}</>:<Text style={ui.small}>Add another reading to see a trend.</Text>}
 <Button secondary onPress={()=>router.push({pathname:"/metric-history",params:{metric:config.type}})}>View full history</Button>
 </>}</Card>;
 })}
 <ReportExports data={data} />
 </Screen>;
}
