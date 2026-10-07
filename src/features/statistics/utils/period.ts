import { Period, Query } from "../types";
export const localISO = (date: Date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
export function parseDate(value: string): Date | null {
 if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
 const [year,month,day]=value.split("-").map(Number); const date=new Date(year,month-1,day,12);
 return localISO(date)===value?date:null;
}
export function periodQuery(period: Exclude<Period,"custom">, anchor: string, timeZone: string): Query {
 const date=parseDate(anchor); if(!date) throw new Error("Invalid date");
 const start=new Date(date); const end=new Date(date);
 if(period==="week") {start.setDate(date.getDate()-((date.getDay()+6)%7));end.setTime(start.getTime());end.setDate(start.getDate()+7);}
 else if(period==="month") {start.setDate(1);end.setDate(1);end.setMonth(end.getMonth()+1);}
 else {start.setMonth(0,1);end.setFullYear(start.getFullYear()+1,0,1);}
 return {start:localISO(start),endExclusive:localISO(end),timeZone};
}
export function customQuery(start: string, inclusiveEnd: string, timeZone: string): Query | null {
 const first=parseDate(start),last=parseDate(inclusiveEnd);if(!first||!last||last<first) return null;
 const end=new Date(last);end.setDate(end.getDate()+1);
 const days=(Date.UTC(end.getFullYear(),end.getMonth(),end.getDate())-Date.UTC(first.getFullYear(),first.getMonth(),first.getDate()))/86400000;
 if(days>3660)return null;
 // Backend uses exclusive limits; do not add 24h in milliseconds across DST.
 return {start,endExclusive:localISO(end),timeZone};
}
export function shiftAnchor(anchor: string, period: Period, direction: number): string {
 const date=parseDate(anchor);if(!date||period==="custom") return anchor;
 if(period==="week")date.setDate(date.getDate()+direction*7);
 else if(period==="month"){date.setDate(1);date.setMonth(date.getMonth()+direction);}
 else date.setFullYear(date.getFullYear()+direction,0,1);
 return localISO(date);
}
export function inclusiveEnd(end: string): string {const date=parseDate(end);if(!date)return end;date.setDate(date.getDate()-1);return localISO(date);}
