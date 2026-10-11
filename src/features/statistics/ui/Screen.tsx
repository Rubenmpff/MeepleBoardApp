import {forwardRef} from 'react';
import {ScrollView,ScrollViewProps,StyleSheet} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {space} from './theme';
// Page content: 16 pt margins, 24 pt between sections, scrolls under the home indicator.
const ScreenScroll=forwardRef<ScrollView,ScrollViewProps>(function ScreenScroll({contentContainerStyle,children,...props},ref){
 const insets=useSafeAreaInsets();
 return <ScrollView ref={ref} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" {...props} contentContainerStyle={[s.content,{paddingBottom:insets.bottom+space.xl},contentContainerStyle]}>{children}</ScrollView>;
});
export default ScreenScroll;
const s=StyleSheet.create({content:{width:'100%',maxWidth:680,alignSelf:'center',padding:space.lg,gap:space.xl}});
