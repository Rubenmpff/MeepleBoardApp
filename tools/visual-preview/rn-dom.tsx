// DOM stand-ins for React Native primitives. Layout follows Yoga defaults: column, flexShrink 0, min sizes 0.
// Interactive elements carry data-hit/data-label so scenarios can press them and metrics can measure them.
import * as React from 'react';
import { createPortal } from 'react-dom';
const W = window as any;
const unitless = new Set(['flex', 'flexGrow', 'flexShrink', 'opacity', 'zIndex', 'fontWeight', 'aspectRatio', 'elevation']);
export function flatten(style: any): any {
  if (!style) return {};
  if (typeof style === 'function') return flatten(style({ pressed: false }));
  if (Array.isArray(style)) return style.reduce((a, s) => Object.assign(a, flatten(s)), {});
  return { ...style };
}
const kebab = (k: string) => k.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
export function css(input: any, text = false): React.CSSProperties {
  const s = flatten(input), o: any = {};
  const fs = W.__fontScale || 1;
  const px = (k: string, v: any) => (typeof v === 'number' && !unitless.has(k) ? v + 'px' : v);
  for (let [k, v] of Object.entries(s)) {
    if (v == null) continue;
    switch (k) {
      case 'flex': if (typeof v === 'number') { if (v > 0) { o.flexGrow = v; o.flexShrink = 1; o.flexBasis = '0%'; } else if (v === 0) { o.flexGrow = 0; o.flexShrink = 0; o.flexBasis = 'auto'; } else { o.flexGrow = 0; o.flexShrink = 1; } } break;
      case 'paddingHorizontal': o.paddingLeft = o.paddingRight = px(k, v); break;
      case 'paddingVertical': o.paddingTop = o.paddingBottom = px(k, v); break;
      case 'marginHorizontal': o.marginLeft = o.marginRight = px(k, v); break;
      case 'marginVertical': o.marginTop = o.marginBottom = px(k, v); break;
      case 'borderTopLeftRadius': case 'borderTopRightRadius': case 'borderBottomLeftRadius': case 'borderBottomRightRadius': case 'borderRadius': o[k] = px(k, v); break;
      case 'shadowColor': case 'shadowOffset': case 'shadowOpacity': case 'shadowRadius': case 'elevation': break;
      case 'transform': o.transform = (v as any[]).map(t => Object.entries(t).map(([a, b]) => `${a}(${typeof b === 'number' && /translate/.test(a) ? b + 'px' : b})`).join(' ')).join(' '); break;
      case 'fontVariant': o.fontVariantNumeric = (v as string[]).join(' '); break;
      case 'textDecorationLine': o.textDecoration = v; break;
      case 'resizeMode': o.objectFit = v === 'stretch' ? 'fill' : v; break;
      case 'tintColor': break;
      case 'fontSize': case 'lineHeight': o[k] = (v as number) * (text ? fs : 1) + 'px'; break;
      case 'letterSpacing': o[k] = v + 'px'; break;
      case 'textAlignVertical': case 'includeFontPadding': case 'writingDirection': break;
      default: o[k] = px(k, v);
    }
  }
  if (s.shadowOpacity) { const off = s.shadowOffset || { width: 0, height: 0 }; o.boxShadow = `${off.width}px ${off.height}px ${s.shadowRadius || 0}px rgba(0,0,0,${s.shadowOpacity})`; }
  return o;
}
const viewBase: React.CSSProperties = { display: 'flex', flexDirection: 'column', position: 'relative', boxSizing: 'border-box', minWidth: 0, minHeight: 0, flexShrink: 0, alignItems: 'stretch', alignContent: 'flex-start', border: '0 solid black', margin: 0, padding: 0 };
const a11y = (p: any) => ({ 'data-label': p.accessibilityLabel, 'data-role': p.accessibilityRole, 'data-test': p.testID, 'aria-hidden': p.accessibilityElementsHidden || p.importantForAccessibility === 'no-hide-descendants' ? true : undefined, 'data-selected': p.accessibilityState?.selected ? '1' : undefined, 'data-expanded': p.accessibilityState?.expanded ? '1' : undefined });
function useLayout(p: any, ref: React.RefObject<HTMLElement | null>) {
  React.useEffect(() => { if (p.onLayout && ref.current) { const r = ref.current.getBoundingClientRect(); p.onLayout({ nativeEvent: { layout: { x: r.x, y: r.y, width: r.width, height: r.height } } }); } });
}
export const View = React.forwardRef((p: any, ref: any) => {
  const own = React.useRef<HTMLDivElement>(null); useLayout(p, own);
  React.useImperativeHandle(ref, () => own.current);
  return <div ref={own} {...a11y(p)} style={{ ...viewBase, ...(p.pointerEvents === 'none' ? { pointerEvents: 'none' } : {}), ...css(p.style) }}>{p.children}</div>;
});
const TextCtx = React.createContext(false);
export const Text = (p: any) => {
  const nested = React.useContext(TextCtx);
  const st = css(p.style, true);
  const clamp = p.numberOfLines ? { display: '-webkit-box', WebkitLineClamp: p.numberOfLines, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as any : {};
  const press = p.onPress ? { 'data-hit': '1', onClick: (e: any) => { e.stopPropagation(); p.onPress({ stopPropagation() { } }); } } : {};
  if (nested) return <span {...press} style={st}>{p.children}</span>;
  return <TextCtx.Provider value={true}><div data-text="1" {...a11y(p)} {...press} style={{ position: 'relative', boxSizing: 'border-box', minWidth: 0, flexShrink: 0, whiteSpace: 'pre-wrap', overflowWrap: 'break-word', fontSize: 14 * (W.__fontScale || 1) + 'px', color: '#000', margin: 0, border: '0 solid black', ...st, ...clamp }}>{p.children}</div></TextCtx.Provider>;
};
function Touchable(p: any) {
  const own = React.useRef<HTMLDivElement>(null); useLayout(p, own);
  return <div ref={own} data-hit="1" {...a11y(p)} data-disabled={p.disabled ? '1' : undefined} onClick={e => { e.stopPropagation(); if (!p.disabled && p.onPress) p.onPress({ stopPropagation() { } }); }}
    style={{ ...viewBase, cursor: 'pointer', ...css(p.style) }}>{typeof p.children === 'function' ? p.children({ pressed: false }) : p.children}</div>;
}
export const TouchableOpacity = Touchable, Pressable = Touchable, TouchableHighlight = Touchable, TouchableWithoutFeedback = Touchable;
export const ScrollView = React.forwardRef((p: any, ref: any) => {
  const own = React.useRef<HTMLDivElement>(null);
  React.useImperativeHandle(ref, () => ({ scrollTo: ({ y = 0, x = 0 }: any) => { if (own.current) { own.current.scrollTop = y; own.current.scrollLeft = x; } }, scrollToEnd() { } }));
  const horizontal = !!p.horizontal;
  return <div ref={own} data-scroll={horizontal ? 'h' : 'v'} onScroll={e => p.onScroll?.({ nativeEvent: { contentOffset: { y: (e.target as any).scrollTop, x: (e.target as any).scrollLeft } } })}
    style={{ ...viewBase, flexGrow: horizontal ? 0 : 1, flexShrink: 1, flexBasis: 'auto', overflowX: horizontal ? 'auto' : 'hidden', overflowY: horizontal ? 'hidden' : 'auto', ...css(p.style) }}>
    <div style={{ ...viewBase, flexDirection: horizontal ? 'row' : 'column', ...(horizontal ? { alignSelf: 'flex-start' } : {}), ...css(p.contentContainerStyle) }}>{p.children}</div>
  </div>;
});
export const KeyboardAvoidingView = View;
export const ActivityIndicator = (p: any) => <div style={{ width: 20, height: 20, margin: '10px auto', borderRadius: 10, border: `2px solid ${p.color || '#888'}`, borderRightColor: 'transparent' }} />;
export const Image = (p: any) => {
  const src = typeof p.source === 'string' ? p.source : p.source?.uri;
  const st = css(p.style);
  return <img alt="" src={src} style={{ display: 'block', boxSizing: 'border-box', flexShrink: 0, objectFit: p.resizeMode === 'contain' ? 'contain' : 'cover', ...st }} />;
};
export const TextInput = (p: any) => {
  const [value, setValue] = React.useState<string | undefined>(undefined);
  const shown = p.value ?? value ?? '';
  React.useEffect(() => { W.__inputs = W.__inputs || {}; W.__inputs[p.accessibilityLabel || p.placeholder] = (t: string) => { setValue(t); p.onChangeText?.(t); }; });
  const st = css(p.style, true);
  return <div data-hit="1" data-label={p.accessibilityLabel} data-input="1" style={{ ...viewBase, justifyContent: 'center', fontSize: 14 * (W.__fontScale || 1) + 'px', ...st, color: shown ? (st.color || '#000') : (p.placeholderTextColor || '#999') }}>{shown || p.placeholder}</div>;
};
// The iOS bar above the number pad only exists with the keyboard open; nothing to draw in a still preview.
export const InputAccessoryView = (_: any) => null;
export const Switch = (p: any) => <div data-hit="1" data-label={p.accessibilityLabel} onClick={() => p.onValueChange?.(!p.value)} style={{ width: 51, height: 31, borderRadius: 16, background: p.value ? (p.trackColor?.true || '#34C759') : (p.trackColor?.false || '#E9E9EA'), position: 'relative', flexShrink: 0 }}><i style={{ position: 'absolute', top: 2, left: p.value ? 22 : 2, width: 27, height: 27, borderRadius: 14, background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,.2)' }} /></div>;
export const ImageBackground = (p: any) => <View style={p.style}><Image source={p.source} style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, p.imageStyle]} resizeMode={p.resizeMode} />{p.children}</View>;
export const SectionList = (p: any) => <ScrollView {...p}>{p.ListHeaderComponent}{(p.sections || []).map((section: any, si: number) => <React.Fragment key={si}>{p.renderSectionHeader?.({ section })}{section.data.map((item: any, index: number) => <React.Fragment key={index}>{p.renderItem({ item, index, section })}</React.Fragment>)}</React.Fragment>)}{p.ListFooterComponent}</ScrollView>;
export const Share = { share: async () => ({ action: 'dismissedAction' }) };
export const StatusBar = () => null;
export const AppState = { currentState: 'active', addEventListener: () => ({ remove() { } }) };
export const Modal = (p: any) => {
  if (!p.visible) return null;
  const root = document.getElementById('modal-root');
  const node = <div data-modal="1" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: p.transparent ? 'transparent' : '#FBFBF8', zIndex: 50 }}>{p.children}</div>;
  return root ? createPortal(node, root) : node;
};
const element = (c: any) => typeof c === 'function' ? React.createElement(c) : c;
export const FlatList = (p: any) => {
  // Like React Native: numColumns groups items into rows, each row styled by columnWrapperStyle.
  const items = (p.data || []).map((item: any, index: number) => <React.Fragment key={p.keyExtractor ? p.keyExtractor(item, index) : index}>{index > 0 && p.numColumns <= 1 ? element(p.ItemSeparatorComponent) : null}{p.renderItem({ item, index })}</React.Fragment>);
  const n = p.numColumns > 1 ? p.numColumns : 1;
  const rows: any[] = [];
  if (n > 1) for (let i = 0; i < items.length; i += n) rows.push(<div key={i} style={{ ...viewBase, flexDirection: 'row', ...css(p.columnWrapperStyle) }}>{items.slice(i, i + n)}</div>);
  return <ScrollView {...p}>{element(p.ListHeaderComponent)}{items.length ? (n > 1 ? rows : <div style={{ ...viewBase, ...(p.horizontal ? { flexDirection: 'row' } : {}) }}>{items}</div>) : element(p.ListEmptyComponent)}{element(p.ListFooterComponent)}</ScrollView>;
};
export const StyleSheet = { create: (v: any) => v, hairlineWidth: 1 / 3, absoluteFill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, absoluteFillObject: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, flatten };
export const Platform = { OS: 'ios', select: (o: any) => o.ios ?? o.default };
export const Keyboard = { dismiss() { }, addListener: () => ({ remove() { } }) };
export const useWindowDimensions = () => ({ width: 402, height: 874, scale: 3, fontScale: W.__fontScale || 1 });
export const Dimensions = { get: () => ({ width: 402, height: 874, scale: 3, fontScale: W.__fontScale || 1 }), addEventListener: () => ({ remove() { } }) };
export const PixelRatio = { get: () => 3, getFontScale: () => W.__fontScale || 1, roundToNearestPixel: (n: number) => n };
export const useColorScheme = () => 'light';
export const Alert = { alert() { } }, Linking = { openURL: async (url: string) => { const w = window as any; w.__external = [...(w.__external || []), url]; } }, BackHandler = { addEventListener: () => ({ remove() { } }) };
export const AccessibilityInfo = { announceForAccessibility() { }, isScreenReaderEnabled: async () => false };
export const LayoutAnimation = { configureNext() { }, Presets: {} };
const anim = () => ({ start(cb?: any) { cb?.({ finished: true }); }, stop() { }, reset() { } });
class AnimatedValue { constructor(public v: number) { } setValue(v: number) { this.v = v; } interpolate(c: any) { return c?.outputRange?.[0] ?? 0; } addListener() { return ''; } removeAllListeners() { } }
export const Animated = { Value: AnimatedValue, timing: anim, spring: anim, loop: anim, sequence: anim, parallel: anim, delay: anim, View, Text, ScrollView, FlatList: (p: any) => <FlatList {...p} />, Image: (p: any) => <Image {...p} />, event: () => () => { } };
export const Easing = new Proxy({}, { get: () => () => (t: number) => t });
export const RefreshControl = () => null;
