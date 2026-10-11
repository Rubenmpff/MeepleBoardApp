import Cocoa
import WebKit
// Snapshots every .phone of the proposal page at 402 × 874, isolated at the top-left corner.
let app=NSApplication.shared
app.setActivationPolicy(.prohibited)
let a=CommandLine.arguments
let input=a[1], outdir=a[2]
class Cap:NSObject,WKNavigationDelegate{
 var n=0,i=0
 func webView(_ v:WKWebView,didFinish nav:WKNavigation!){
  DispatchQueue.main.asyncAfter(deadline:.now()+2.0){
   v.evaluateJavaScript("JSON.stringify([...document.querySelectorAll('.phone')].map(p=>{const f=p.closest('figure');return f?f.querySelector('figcaption b').textContent+' | '+f.closest('section').id:''}))"){r,_ in
    try? ((r as? String) ?? "[]").write(toFile:outdir+"/phones.json",atomically:true,encoding:.utf8)
    self.n=((try? JSONSerialization.jsonObject(with:((r as? String) ?? "[]").data(using:.utf8)!)) as? [Any])?.count ?? 0
    self.next(v)}}
 }
 func next(_ v:WKWebView){
  if i>=n {exit(0)}
  let js="(()=>{document.getElementById('__c')?.remove();window.scrollTo(0,0);const p=document.querySelectorAll('.phone')[\(i)].cloneNode(true);p.id='__c';Object.assign(p.style,{position:'fixed',top:'0',left:'0',zIndex:'99999',borderRadius:'0',boxShadow:'none',margin:'0'});document.body.appendChild(p);})()"
  v.evaluateJavaScript(js){_,_ in
   DispatchQueue.main.asyncAfter(deadline:.now()+0.3){
    let c=WKSnapshotConfiguration();c.rect=CGRect(x:0,y:0,width:402,height:874)
    v.takeSnapshot(with:c){img,_ in
     if let img=img,let t=img.tiffRepresentation,let r=NSBitmapImageRep(data:t),let p=r.representation(using:.png,properties:[:]){try? p.write(to:URL(fileURLWithPath:outdir+"/phone-\(self.i).png"))}
     self.i+=1;self.next(v)}}}
 }
}
let cap=Cap();let v=WKWebView(frame:NSRect(x:0,y:0,width:1300,height:1000));v.navigationDelegate=cap
let win=NSWindow(contentRect:NSRect(x:0,y:0,width:1300,height:1000),styleMask:[],backing:.buffered,defer:false);win.contentView=v
v.loadFileURL(URL(fileURLWithPath:input),allowingReadAccessTo:URL(fileURLWithPath:"/"))
DispatchQueue.main.asyncAfter(deadline:.now()+90){print("timeout");exit(2)}
app.run()
