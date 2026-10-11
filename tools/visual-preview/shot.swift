import Cocoa
import WebKit
let app=NSApplication.shared
app.setActivationPolicy(.prohibited)
let a=CommandLine.arguments
let input=a[1], hash=a[2], output=a[3]  // harness page, JSON scenario (URL fragment), PNG path
class Cap:NSObject,WKNavigationDelegate{
 var tries=0
 func poll(_ v:WKWebView){
  v.evaluateJavaScript("window.__ready===true"){r,_ in
   if (r as? Bool)==true || self.tries>60 { self.snap(v) } else { self.tries+=1; DispatchQueue.main.asyncAfter(deadline:.now()+0.2){ self.poll(v) } }
  }
 }
 func snap(_ v:WKWebView){
  v.evaluateJavaScript("JSON.stringify({m:window.__metrics,e:window.__error||null})"){r,_ in
   try? ((r as? String) ?? "{}").write(toFile:output+".json",atomically:true,encoding:.utf8)
   let c=WKSnapshotConfiguration();c.rect=CGRect(x:0,y:0,width:402,height:874)
   v.takeSnapshot(with:c){img,err in
    guard let img=img,let t=img.tiffRepresentation,let r=NSBitmapImageRep(data:t),let p=r.representation(using:.png,properties:[:]) else{print("err",err as Any);exit(1)}
    try! p.write(to:URL(fileURLWithPath:output));exit(0)}
  }
 }
 func webView(_ v:WKWebView,didFinish n:WKNavigation!){ poll(v) }
}
let cap=Cap();let v=WKWebView(frame:NSRect(x:0,y:0,width:402,height:874));v.navigationDelegate=cap
let win=NSWindow(contentRect:NSRect(x:0,y:0,width:402,height:874),styleMask:[],backing:.buffered,defer:false);win.contentView=v
var comps=URLComponents(url:URL(fileURLWithPath:input),resolvingAgainstBaseURL:false)!;comps.fragment=hash
v.loadFileURL(comps.url!,allowingReadAccessTo:URL(fileURLWithPath:"/"))
DispatchQueue.main.asyncAfter(deadline:.now()+40){print("timeout");exit(2)}
app.run()
