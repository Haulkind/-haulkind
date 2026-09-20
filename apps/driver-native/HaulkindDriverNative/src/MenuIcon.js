import React from 'react';
import { Image } from 'react-native';

const icons = {
  dashboard: require('./assets/navigation/dashboard.png'),
  profile: require('./assets/navigation/profile.png'),
  orders: require('./assets/navigation/orders.png'),
  history: require('./assets/navigation/history.png'),
  earnings: require('./assets/navigation/earnings.png'),
  documents: require('./assets/navigation/documents.png'),
  settings: require('./assets/navigation/settings.png'),
  logout: require('./assets/navigation/logout.png'),
  back: require('./assets/navigation/back.png'),
  location: require('./assets/navigation/location.png'),
};

export default function MenuIcon({ name, color = '#1a3a4a', size = 24 }) {
  return <Image source={icons[name]} accessible={false} style={{ width: size, height: size, tintColor: color }} />;
}
