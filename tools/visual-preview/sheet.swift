import Cocoa
// Contact sheet: sheet <out.png> <columns> <image>... — each image scaled to 402 × 874, captioned with its file name.
let a=CommandLine.arguments
let out=a[1], cols=Int(a[2])!, files=Array(a.dropFirst(3))
let w=402.0, h=874.0, cap=26.0, gap=12.0
let rows=Int(ceil(Double(files.count)/Double(cols)))
let size=NSSize(width:Double(cols)*(w+gap)+gap, height:Double(rows)*(h+cap+gap)+gap)
let rep=NSBitmapImageRep(bitmapDataPlanes:nil,pixelsWide:Int(size.width),pixelsHigh:Int(size.height),bitsPerSample:8,samplesPerPixel:4,hasAlpha:true,isPlanar:false,colorSpaceName:.deviceRGB,bytesPerRow:0,bitsPerPixel:0)!
NSGraphicsContext.saveGraphicsState(); NSGraphicsContext.current=NSGraphicsContext(bitmapImageRep:rep)
NSColor(calibratedWhite:0.9,alpha:1).setFill(); NSRect(origin:.zero,size:size).fill()
for (i,f) in files.enumerated(){
 let c=Double(i%cols), r=Double(i/cols)
 let x=gap+c*(w+gap), yTop=size.height-gap-r*(h+cap+gap)
 (URL(fileURLWithPath:f).deletingPathExtension().lastPathComponent as NSString).draw(at:NSPoint(x:x,y:yTop-20),withAttributes:[.font:NSFont.boldSystemFont(ofSize:16),.foregroundColor:NSColor.black])
 NSImage(contentsOfFile:f)?.draw(in:NSRect(x:x,y:yTop-cap-h,width:w,height:h))
}
NSGraphicsContext.restoreGraphicsState()
try! rep.representation(using:.png,properties:[:])!.write(to:URL(fileURLWithPath:out))
