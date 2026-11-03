import { useCallback, useRef, useState } from "react";
import { Switch, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { api } from "@/services/api";
import { shareReport } from "@/services/report-files";
import type { DailySummaryResponse } from "@/services/daily-summary";
import { Button, Card, ui } from "./ui";
import { ReportFeedback, type ReportPhase } from "./report-feedback";
export type GeneratedReport = { report_id: number; title: string; ai_status: string; file_size_kb: number; start_date?: string; end_date?: string; created_at?: string };
export function ReportExports({ data }: { data: DailySummaryResponse | null }) {
 const [history,setHistory]=useState<GeneratedReport[]>([]),[aiAvailable,setAiAvailable]=useState(false),[includeAi,setIncludeAi]=useState(false);
 const [phase,setPhase]=useState<ReportPhase|null>(null),[latest,setLatest]=useState<GeneratedReport|null>(null),[error,setError]=useState(""),[historyError,setHistoryError]=useState(""),[busy,setBusy]=useState(false),[more,setMore]=useState(false),[retry,setRetry]=useState(0);
 const generation=useRef(0);
 useFocusEffect(useCallback(()=>{const id=++generation.current;
 setPhase(current => current === "generating" ? null : current);
 api.reportHistory().then(result=>{if(id===generation.current){setHistory(result.reports);setMore(result.reports.length===20);setHistoryError("");}}).catch(()=>{if(id===generation.current)setHistoryError("Couldn’t load report history.");});
 api.reportCapabilities().then(result=>{if(id===generation.current)setAiAvailable(result.ai_available);}).catch(()=>{if(id===generation.current)setAiAvailable(false);});
 return()=>{generation.current++;};},[retry]));
 async function generate(){if(!data||busy)return;setBusy(true);setError("");setPhase("generating");setLatest(null);const id=generation.current;
 try{const result=await api.generateReport({start_at:data.start_at,today_start:data.today_start,end_at:data.end_at,timezone_name:Intl.DateTimeFormat().resolvedOptions().timeZone,include_ai:includeAi,ai_consent:includeAi});if(id!==generation.current)return;setLatest(result);setPhase("ready");setRetry(v=>v+1);}
 catch(cause){if(id===generation.current){setPhase("error");setError(cause instanceof Error?cause.message:"Report failed. Check history before retrying.");}}
 finally{setBusy(false);}}
 async function share(id:number){if(busy)return;setBusy(true);setError("");try{await shareReport(id);}catch(cause){setError(cause instanceof Error?cause.message:"Couldn’t share this report.");}finally{setBusy(false);}}
 async function loadMore(){setBusy(true);const id=generation.current;try{const result=await api.reportHistory(history.length);if(id===generation.current){setHistory(current=>[...current,...result.reports]);setMore(result.reports.length===20);}}catch{if(id===generation.current)setHistoryError("Couldn’t load more reports.");}finally{setBusy(false);}}
 return <Card><Text accessibilityRole="header" style={ui.heading}>Generate a PDF report</Text><Text style={ui.body}>Create a private copy of this period’s saved readings and assessments. PDFs can contain sensitive health information; choose recipients carefully.</Text>
 <View style={[ui.row,{justifyContent:"space-between"}]}><Text style={[ui.body,{flex:1}]}>Include an AI explanation</Text><Switch accessibilityLabel="Include AI explanation and send summary to OpenAI" value={includeAi} disabled={!aiAvailable||busy} onValueChange={setIncludeAi}/></View>
 <Text style={ui.small}>{aiAvailable?"Turning this on and tapping Generate sends a summary of measurements, assessment context, classifications and dates to OpenAI. Your name and email are excluded. The explanation is saved with the PDF and may contain mistakes.":"AI explanations are unavailable right now. You can still generate a PDF of your saved data."}</Text>
 <Button disabled={!data?.records.length||busy} onPress={()=>void generate()}>{busy&&phase==="generating"?"Generating PDF…":"Generate PDF"}</Button>
 {phase&&<ReportFeedback phase={phase}/>} {!!error&&<Text accessibilityRole="alert" style={ui.body}>{error}</Text>}
 {latest&&<><Text style={ui.body}>{latest.ai_status==="unavailable"?"PDF created. AI was unavailable, so no AI explanation was included.":latest.ai_status==="included"?"PDF created with an AI explanation. Review it against your saved assessments.":"PDF created without an AI explanation."}</Text><Button disabled={busy} onPress={()=>void share(latest.report_id)}>Download / share PDF</Button></>}
 <Text accessibilityRole="header" style={ui.heading}>Report history</Text>{!!historyError&&<Text accessibilityRole="alert" style={ui.body}>{historyError}</Text>}<Button secondary disabled={busy} onPress={()=>setRetry(v=>v+1)}>Refresh report history</Button>
 {!history.length&&!historyError&&<Text style={ui.small}>No generated reports loaded yet.</Text>}
 {history.map(report=><View key={report.report_id} style={{gap:8,paddingVertical:8}}><Text style={ui.body}>{report.title}</Text><Text style={ui.small}>{report.start_date} – {report.end_date} · {report.file_size_kb} KB · {report.ai_status==="included"?"AI explanation included":"Saved-data PDF"}</Text><Button secondary disabled={busy} onPress={()=>void share(report.report_id)}>Download / share report #{report.report_id}</Button></View>)}
 {more&&<Button secondary disabled={busy} onPress={()=>void loadMore()}>Load more reports</Button>}
 </Card>;
}
