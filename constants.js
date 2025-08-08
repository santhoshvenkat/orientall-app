import React from 'react';
import ReactDOM from 'react-dom/client';


const e = React.createElement;

export const ICONS = {
  ALARM: e('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M10.34 1.87a.75.75 0 0 1 .82 0l4.5 2.25a.75.75 0 0 1 0 1.36l-4.5 2.25a.75.75 0 0 1-.82 0l-4.5-2.25a.75.75 0 0 1 0-1.36l4.5-2.25ZM12 12.75a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z" }),
  STOPWATCH: e('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M9.53 2.47a.75.75 0 0 1 1.06 0l7.5 7.5a.75.75 0 0 1-1.06 1.06L12 6.06l-5.03 5.03a.75.75 0 0 1-1.06-1.06l7.5-7.5ZM12 10.5a5.25 5.25 0 1 1 0 10.5 5.25 5.25 0 0 1 0-10.5Z" }),
  TIMER: e('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" }),
  SUN: e('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" }),
  ROTATE: e('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.82m5.84-2.56a12.022 12.022 0 0 0-5.84-2.56v4.82m0 0a6 6 0 0 1 6.12-6.12m-6.12 6.12a6 6 0 0 1-6.12-6.12m6.12 6.12v-4.82" }),
  INFO: e('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" }),
  PHONE: e('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75A2.25 2.25 0 0 0 15.75 1.5h-2.25M12 18.75h.008v.008H12v-.008Z" })
};
