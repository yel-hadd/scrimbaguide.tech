/**
 * GA4 for scrimbaguide.tech. Replaces the preset's `gtag` option so the
 * <head> script can, in this order:
 *   1. set Consent Mode v2 defaults (denied in the EEA, UK and Switzerland,
 *      analytics granted elsewhere; ads storage denied everywhere) and
 *      replay a stored banner choice before anything is measured;
 *   2. label the first page_view with `content_group` (it goes out from
 *      `config`, before React runs, so a client module cannot label it).
 *      It is set at `set` scope, not as a config parameter: config wins
 *      over set, which would pin every later event to the landing group;
 *   3. load gtag.js only on the production hostname. Elsewhere `gtag` still
 *      queues into an inert `dataLayer`, which keeps local tests inspectable
 *      without sending localhost hits.
 * The client module sends SPA page_views with the same content_group.
 */

const path = require('node:path');
const CONTENT_GROUP_RULES = require('../../src/utils/contentGroupRules.json');

const MEASUREMENT_ID = 'G-03WS2KR7EX';
const SITE_HOSTNAME = 'scrimbaguide.tech';
const CONSENT_STORAGE_KEY = 'sg-consent';
const CONSENT_REGIONS = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE',
  'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
  'IS', 'LI', 'NO', 'GB', 'CH',
  // EU outermost regions and Aland geolocate under their own codes.
  'RE', 'GP', 'MQ', 'GF', 'YT', 'MF', 'AX',
];

function headScript(rules) {
  return `(function(){
window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments);}
window.gtag=gtag;
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',region:${JSON.stringify(CONSENT_REGIONS)},wait_for_update:500});
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'granted'});
var c=null;try{c=localStorage.getItem('${CONSENT_STORAGE_KEY}');}catch(e){}
if(c==='granted'||c==='denied'){gtag('consent','update',{analytics_storage:c});}
var rules=${JSON.stringify(rules)},p=location.pathname,cg='other';
if(p.charAt(p.length-1)!=='/'){p+='/';}
for(var i=0;i<rules.length;i++){if(new RegExp(rules[i][0]).test(p)){cg=rules[i][1];break;}}
gtag('set',{content_group:cg});
gtag('js',new Date());
gtag('config','${MEASUREMENT_ID}');
if(location.hostname!=='${SITE_HOSTNAME}'){return;}
var s=document.createElement('script');s.async=true;
s.src='https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}';
document.head.appendChild(s);
})();`;
}

module.exports = function analyticsPlugin() {
  if (process.env.NODE_ENV !== 'production') return null;
  return {
    name: 'scrimbaguide-analytics',
    getClientModules() {
      return [path.resolve(__dirname, './client.js')];
    },
    injectHtmlTags() {
      return {
        headTags: [
          { tagName: 'link', attributes: { rel: 'preconnect', href: 'https://www.googletagmanager.com' } },
          { tagName: 'link', attributes: { rel: 'preconnect', href: 'https://www.google-analytics.com' } },
          { tagName: 'script', innerHTML: headScript(CONTENT_GROUP_RULES) },
        ],
      };
    },
  };
};

module.exports.CONSENT_STORAGE_KEY = CONSENT_STORAGE_KEY;
