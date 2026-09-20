import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { DRIVER_MAP_HTML, mapUpdateScript } from './driverMap';
import MenuIcon from './MenuIcon';

const source = { html: DRIVER_MAP_HTML };

export default function DriverMap({ location, orders, radiusMiles, onOrderPress }) {
  const webView = useRef(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const script = mapUpdateScript(location, orders, radiusMiles);
  const latestScript = useRef(script);
  latestScript.current = script;

  useEffect(() => {
    if (ready) webView.current?.injectJavaScript(script);
  }, [ready, script]);

  useEffect(() => {
    if (ready || failed) return;
    const timeout = setTimeout(() => setFailed(true), 15000);
    return () => clearTimeout(timeout);
  }, [ready, failed]);

  function onMessage(event) {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      if (message.type === 'ready') {
        webView.current?.injectJavaScript(latestScript.current);
        setReady(true);
        setFailed(false);
      } else if (message.type === 'orderClick') {
        onOrderPress(message.id);
      } else if (message.type === 'mapError') {
        setFailed(true);
      }
    } catch {}
  }

  return (
    <View style={{ flex: 1 }}>
      <WebView
        ref={webView}
        source={source}
        applicationNameForUserAgent="HaulkindDriver/1.0.2 (+https://haulkind.com)"
        style={{ flex: 1 }}
        onMessage={onMessage}
        onLoadStart={() => setReady(false)}
        onError={() => setFailed(true)}
        onRenderProcessGone={() => setFailed(true)}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
      />
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={failed ? 'Reload map' : 'Center map on my location'}
        disabled={!failed && (!ready || !location)}
        onPress={() => {
          if (failed) {
            setFailed(false);
            webView.current?.reload();
          } else {
            webView.current?.injectJavaScript('window.centerOnDriver();true;');
          }
        }}
        style={{ position: 'absolute', right: 12, bottom: 24, backgroundColor: '#fff', borderRadius: 12, padding: 14, elevation: 4 }}
      >
        {failed ? <Text style={{ color: '#1a56db', fontWeight: '600' }}>Reload map</Text> : <MenuIcon name="location" color="#1a56db" />}
      </TouchableOpacity>
    </View>
  );
}
