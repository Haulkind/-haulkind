import vm from 'node:vm';
import { DRIVER_MAP_HTML, mapUpdateScript } from '../src/driverMap';

function mapHarness() {
  const shapes = [];
  const markerClicks = [];
  const mapEvents = {};
  const map = {
    setView: jest.fn().mockReturnThis(),
    panTo: jest.fn(), invalidateSize: jest.fn(), getZoom: () => 15,
    on: jest.fn((event, handler) => { mapEvents[event] = handler; }),
  };
  const makeShape = (point) => {
    const shape = {
      point,
      addTo: jest.fn().mockReturnThis(),
      setLatLng: jest.fn((next) => { shape.point = next; }),
      setRadius: jest.fn(),
      getLatLng: () => shape.point,
    };
    shapes.push(shape);
    return shape;
  };
  const orderLayer = { addTo: jest.fn().mockReturnThis(), clearLayers: jest.fn() };
  const L = {
    map: jest.fn(() => map),
    tileLayer: jest.fn(() => ({ addTo: jest.fn().mockReturnThis(), on: jest.fn().mockReturnThis() })),
    circleMarker: jest.fn(makeShape), circle: jest.fn(makeShape),
    layerGroup: jest.fn(() => orderLayer),
    divIcon: jest.fn(x => x),
    marker: jest.fn(() => ({
      addTo: jest.fn().mockReturnThis(),
      on: jest.fn((event, handler) => markerClicks.push(handler)),
    })),
  };
  const window = { ReactNativeWebView: { postMessage: jest.fn() }, addEventListener: jest.fn() };
  const context = vm.createContext({ L, window, document: { createElement: () => ({}) } });
  const script = DRIVER_MAP_HTML.match(/<script>([\s\S]*)<\/script>/)[1];
  vm.runInContext(script, context);
  const update = (location, orders = []) => vm.runInContext(mapUpdateScript(location, orders, 80), context);
  return { context, window, L, shapes, map, mapEvents, update, markerClicks };
}

test('starts without a fake driver marker and signals readiness', () => {
  const { L, window, update } = mapHarness();
  update(null);
  expect(L.circleMarker).not.toHaveBeenCalled();
  expect(JSON.parse(window.ReactNativeWebView.postMessage.mock.calls[0][0])).toEqual({ type: 'ready' });
  expect(L.tileLayer.mock.calls[0][0]).toBe('https://tile.openstreetmap.org/{z}/{x}/{y}.png');
});

test('updates the driver, accuracy and radius without recreating the map', () => {
  const { L, shapes, map, update } = mapHarness();
  update({ latitude: 0, longitude: 0, accuracy: 10 });
  update({ latitude: 0.001, longitude: 0.002, accuracy: 8 });
  expect(L.map).toHaveBeenCalledTimes(1);
  expect(L.circleMarker).toHaveBeenCalledTimes(1);
  shapes.forEach(shape => expect(shape.point).toEqual([0.001, 0.002]));
  expect(shapes[1].setRadius).toHaveBeenLastCalledWith(8);
  expect(map.panTo).toHaveBeenLastCalledWith([0.001, 0.002], { animate: false });
});

test('respects manual panning until the driver taps recenter', () => {
  const { update, mapEvents, window, map } = mapHarness();
  update({ latitude: 1, longitude: 2 });
  mapEvents.dragstart();
  update({ latitude: 3, longitude: 4 });
  expect(map.panTo).not.toHaveBeenCalled();
  window.centerOnDriver();
  expect(map.setView).toHaveBeenLastCalledWith([3, 4], 15);
  update({ latitude: 5, longitude: 6 });
  expect(map.panTo).toHaveBeenCalled();
});

test('order IDs are serialized safely and order clicks retain their original IDs', () => {
  const { update, window, markerClicks } = mapHarness();
  const id = "order'</script>;window.bad=true";
  update(null, [{ id, coords: { latitude: 1, longitude: 2 }, estimated_price: '90', distance: 1.5, isNew: true }]);
  markerClicks[0]();
  expect(JSON.parse(window.ReactNativeWebView.postMessage.mock.calls[1][0])).toEqual({ type: 'orderClick', id });
  expect(window.bad).toBeUndefined();
});
