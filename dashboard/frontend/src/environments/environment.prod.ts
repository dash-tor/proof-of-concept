export const environment = {
  production: true,
  wsEndpoint: 'ws:'+ window.location.href.split(':')[1].replace('//', '').split('/')[0] + ':5678',
  reconnectInterval: 2000
};