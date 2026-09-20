export const DRIVER_MAP_HTML = `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
html, body, #map { margin: 0; width: 100%; height: 100%; }
.custom-pin { background: none; border: none; }
.order-price { background: #1a56db; color: white; padding: 4px 8px; border-radius: 8px; font: bold 12px sans-serif; white-space: nowrap; border: 2px solid white; }
.order-price.new { background: #ef4444; }
.leaflet-control-attribution { font-size: 9px; }
</style></head><body><div id="map"></div><script>
var map = L.map('map', { zoomControl: false }).setView([39.9526, -75.1652], 10);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
}).on('tileerror', function() {
  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapError' }));
}).addTo(map);
var driverMarker = null;
var accuracyCircle = null;
var radiusCircle = null;
var orderLayer = L.layerGroup().addTo(map);
var following = true;
map.on('dragstart', function() { following = false; });
window.centerOnDriver = function() {
  following = true;
  if (driverMarker) map.setView(driverMarker.getLatLng(), Math.max(map.getZoom(), 15));
};
window.updateDriverMap = function(data) {
  if (data.location) {
    var loc = data.location;
    var point = [loc.latitude, loc.longitude];
    if (!driverMarker) {
      driverMarker = L.circleMarker(point, { radius: 8, fillColor: '#1a56db', color: '#fff', weight: 3, fillOpacity: 1 }).addTo(map);
      accuracyCircle = L.circle(point, { color: '#3b82f6', weight: 1, fillOpacity: 0.12 }).addTo(map);
      radiusCircle = L.circle(point, { radius: data.radiusMiles * 1609.34, color: '#1a56db', fillOpacity: 0.03, weight: 1, dashArray: '5,5' }).addTo(map);
      map.setView(point, 15);
    } else {
      driverMarker.setLatLng(point);
      accuracyCircle.setLatLng(point);
      radiusCircle.setLatLng(point);
      if (following) map.panTo(point, { animate: false });
    }
    accuracyCircle.setRadius(Math.max(0, loc.accuracy || 0));
  }
  orderLayer.clearLayers();
  data.orders.forEach(function(order) {
    var label = document.createElement('div');
    label.className = 'order-price' + (order.isNew ? ' new' : '');
    label.textContent = '$' + order.price + (order.distance ? ' ' + order.distance : '');
    L.marker([order.latitude, order.longitude], {
      icon: L.divIcon({ className: 'custom-pin', html: label, iconSize: [80, 30], iconAnchor: [40, 30] })
    }).addTo(orderLayer).on('click', function() {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'orderClick', id: order.id }));
    });
  });
};
window.addEventListener('resize', function() { map.invalidateSize(); });
window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
</script></body></html>`;

export function mapUpdateScript(location, orders, radiusMiles) {
  const payload = {
    location,
    radiusMiles,
    orders: orders.filter(order => order.coords &&
      Number.isFinite(order.coords.latitude) && Number.isFinite(order.coords.longitude))
      .map(order => ({
        id: order.id,
        latitude: order.coords.latitude,
        longitude: order.coords.longitude,
        price: (Number(order.estimated_price || order.final_price) || 0).toFixed(0),
        distance: Number.isFinite(order.distance) ? order.distance.toFixed(1) + 'mi' : '',
        isNew: !!order.isNew,
      })),
  };
  return `window.updateDriverMap(${JSON.stringify(payload).replace(/</g, '\\u003c')});true;`;
}
