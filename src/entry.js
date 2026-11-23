import { challenge } from './config/challenge.js';

const url = new URL(location.href);
if (url.searchParams.get('challenge') === challenge.id) {
  // Previously shared challenge links used the home page.
  url.pathname = '/pour';
  location.replace(url);
} else {
  import('./piles/main.js');
}
