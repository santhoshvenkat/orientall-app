import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ICONS } from './constants.js';
import { fetchWeather, fetchWeatherByCity } from './services/geminiService.js';

const e = React.createElement;

// --- Custom Hook for Orientation ---
const useOrientation = () => {
  const getOrientation = useCallback(() => {
    if (typeof window === 'undefined' || !window.screen || !window.screen.orientation) {
      return 'unknown';
    }
    const { type } = window.screen.orientation;
    if (type.startsWith('portrait')) {
        return window.screen.orientation.angle === 0 ? 'portrait-primary' : 'portrait-secondary';
    }
    if (type.startsWith('landscape')) {
        return window.screen.orientation.angle === 90 ? 'landscape-primary' : 'landscape-secondary';
    }
    return 'unknown';
  }, []);

  const [orientation, setOrientation] = useState(getOrientation());

  useEffect(() => {
    const handleOrientationChange = () => setOrientation(getOrientation());
    
    if (window.screen.orientation) {
        window.screen.orientation.addEventListener('change', handleOrientationChange);
        return () => window.screen.orientation.removeEventListener('change', handleOrientationChange);
    }
    return () => {};
  }, [getOrientation]);

  return orientation;
};

// --- Reusable UI Components ---

const Icon = ({ children, className = '' }) => e(
  'svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.5, stroke: "currentColor", className: `w-8 h-8 ${className}` },
  children
);

const Card = ({ title, icon, children }) => e(
  'div', { className: "w-full max-w-sm mx-auto bg-black/40 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden border border-white/10" },
  e('div', { className: "p-5 border-b border-white/10 flex items-center space-x-4" },
    e('div', { className: "text-blue-400" }, icon),
    e('h2', { className: "text-xl font-bold tracking-tight text-white" }, title)
  ),
  e('div', { className: "p-6" }, children)
);

const Button = ({ onClick, children, className = '', disabled = false, type = 'button' }) => e(
    'button',
    {
        type,
        onClick,
        disabled,
        className: `px-6 py-3 rounded-xl font-semibold text-white transition-all duration-150 transform active:scale-95 disabled:bg-gray-600 disabled:opacity-70 disabled:cursor-not-allowed ${className}`
    },
    children
);

// --- View Components ---

const WelcomeView = ({ show }) => e(
    'div', { className: `fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50 text-slate-800 p-8 transition-opacity duration-700 ease-in-out ${show ? 'opacity-100' : 'opacity-0 pointer-events-none'}`},
    e('div', { className: "flex flex-col items-center justify-center text-center max-w-sm mx-auto animate-[fade-in_1s_ease-in-out]" },
        e('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.5, stroke: "currentColor", className: "w-16 h-16 text-blue-600 mb-6" },
            ICONS.PHONE
        ),
        e('h1', { className: "text-4xl font-bold mb-3 text-slate-900" }, "Welcome to OrientAll"),
        e('p', { className: "text-lg text-slate-600 mb-8" }, "This app changes based on your phone's orientation."),
        e('div', { className: "space-y-3 text-left text-slate-700 self-stretch text-md" },
            e('p', null, e('strong', { className: "font-semibold text-slate-900 w-40 inline-block" }, "Upright:"), " Alarm Clock"),
            e('p', null, e('strong', { className: "font-semibold text-slate-900 w-40 inline-block" }, "Landscape Right:"), " Stopwatch"),
            e('p', null, e('strong', { className: "font-semibold text-slate-900 w-40 inline-block" }, "Upside Down:"), " Timer"),
            e('p', null, e('strong', { className: "font-semibold text-slate-900 w-40 inline-block" }, "Landscape Left:"), " Weather")
        ),
        e('p', { className: "text-sm text-slate-500 mt-10" }, "Best experienced on a mobile device.")
    )
);

const HomeView = () => e(
  'div', { className: "flex flex-col items-center justify-center text-center p-8" },
  e(Icon, { className: "w-24 h-24 text-blue-400 mb-6 animate-[spin_5s_linear_infinite]" }, ICONS.ROTATE),
  e('h1', { className: "text-3xl font-bold mb-2" }, "OrientAll"),
  e('p', { className: "text-lg text-gray-300" }, "Rotate your device or use the controls above to switch tools.")
);

const AlarmView = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [alarmTime, setAlarmTime] = useState('');
    const [isAlarmSet, setIsAlarmSet] = useState(false);
    const audioRef = useRef(null);

    useEffect(() => {
        const timerId = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    useEffect(() => {
        if (isAlarmSet && alarmTime) {
            const now = new Date();
            const [hours, minutes] = alarmTime.split(':');
            const alarmDate = new Date();
            alarmDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            if (now.getHours() === alarmDate.getHours() && now.getMinutes() === alarmDate.getMinutes() && now.getSeconds() === 0) {
                audioRef.current?.play();
                alert(`Alarm! It's ${alarmTime}`);
                setIsAlarmSet(false);
            }
        }
    }, [currentTime, isAlarmSet, alarmTime]);
    
    useEffect(() => {
       audioRef.current = new Audio('https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg');
    }, []);

    return e(Card, { title: "Alarm Clock", icon: e(Icon, null, ICONS.ALARM) },
        e('div', { className: "text-center" },
            e('p', { className: "text-6xl font-mono font-bold text-white tracking-wider" }, currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
            e('p', { className: "text-lg text-gray-400" }, currentTime.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }))
        ),
        e('div', { className: "mt-8 flex flex-col items-center space-y-4" },
            e('input', {
                type: "time",
                'aria-label': "Set alarm time",
                value: alarmTime,
                onChange: (e) => setAlarmTime(e.target.value),
                className: "bg-gray-700 border border-gray-600 rounded-lg p-3 text-white w-full max-w-xs text-center text-lg",
                disabled: isAlarmSet
            }),
            e(Button, {
                onClick: () => setIsAlarmSet(!isAlarmSet),
                disabled: !alarmTime,
                className: `w-full max-w-xs ${isAlarmSet ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`
            }, isAlarmSet ? `Stop Alarm (${alarmTime})` : 'Set Alarm')
        )
    );
};

const StopwatchView = () => {
    const [time, setTime] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [laps, setLaps] = useState([]);
    const timerRef = useRef(null);

    const formatTime = (time) => {
        const minutes = Math.floor((time / 60000) % 60).toString().padStart(2, '0');
        const seconds = Math.floor((time / 1000) % 60).toString().padStart(2, '0');
        const milliseconds = (time % 1000).toString().padStart(3, '0').slice(0, 2);
        return `${minutes}:${seconds}.${milliseconds}`;
    };
    
    const start = () => {
        if (isRunning) return;
        setIsRunning(true);
        const startTime = Date.now() - time;
        timerRef.current = window.setInterval(() => {
            setTime(Date.now() - startTime);
        }, 10);
    };

    const stop = () => {
        setIsRunning(false);
        if(timerRef.current) clearInterval(timerRef.current);
    };

    const reset = () => {
        stop();
        setTime(0);
        setLaps([]);
    };

    const lap = () => {
        if (isRunning) {
            setLaps(prev => [time, ...prev]);
        }
    };
    
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    return e(Card, { title: "Stopwatch", icon: e(Icon, null, ICONS.STOPWATCH) },
        e('div', { className: "text-center mb-6" },
            e('p', { className: "text-7xl font-mono font-bold text-white tracking-tighter", 'aria-live': "polite" }, formatTime(time))
        ),
        e('div', { className: "grid grid-cols-2 gap-4 mb-6" },
            e(Button, { onClick: isRunning ? stop : start, className: isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600' }, isRunning ? 'Stop' : 'Start'),
            e(Button, { onClick: lap, disabled: !isRunning, className: "bg-gray-600 hover:bg-gray-700" }, 'Lap')
        ),
        e('div', { className: "text-center" },
            e('button', { onClick: reset, className: "text-gray-400 hover:text-white transition-colors" }, 'Reset')
        ),
        laps.length > 0 && e('div', { className: "mt-4 max-h-36 overflow-y-auto space-y-2 pr-2" },
            laps.map((lapTime, index) => {
                const prevLapTime = laps[index + 1] || 0;
                return e('div', { key: index, className: "flex justify-between items-center bg-gray-800/50 p-2 rounded-md text-sm" },
                    e('span', { className: "font-medium text-gray-400" }, `Lap ${laps.length - index}`),
                    e('span', { className: "font-mono text-gray-300" }, formatTime(lapTime - prevLapTime)),
                    e('span', { className: "font-mono text-white" }, formatTime(lapTime))
                )
            })
        )
    );
};

const TimerView = () => {
    const [initialTime, setInitialTime] = useState(300); // 5 minutes
    const [timeLeft, setTimeLeft] = useState(initialTime);
    const [isRunning, setIsRunning] = useState(false);
    const timerRef = useRef(null);
    const audioRef = useRef(null);

    useEffect(() => {
       audioRef.current = new Audio('https://actions.google.com/sounds/v1/alarms/digital_watch_alarm.ogg');
    }, []);

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    const startTimer = useCallback(() => {
        if (timeLeft <= 0 || isRunning) return;
        setIsRunning(true);
        const endTime = Date.now() + timeLeft * 1000;
        timerRef.current = window.setInterval(() => {
            const newTimeLeft = Math.round((endTime - Date.now()) / 1000);
            if (newTimeLeft <= 0) {
                setTimeLeft(0);
                setIsRunning(false);
                if(timerRef.current) clearInterval(timerRef.current);
                audioRef.current?.play();
                alert("Time's up!");
            } else {
                setTimeLeft(newTimeLeft);
            }
        }, 1000);
    }, [timeLeft, isRunning]);

    const stopTimer = () => {
        setIsRunning(false);
        if(timerRef.current) clearInterval(timerRef.current);
    };

    const resetTimer = () => {
        stopTimer();
        setTimeLeft(initialTime);
    };
    
    const handleSetTime = (seconds) => {
        if(isRunning) return;
        setInitialTime(seconds);
        setTimeLeft(seconds);
    }
    
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    return e(Card, { title: "Timer", icon: e(Icon, null, ICONS.TIMER) },
        e('div', { className: "text-center mb-6" },
            e('p', { className: "text-7xl font-mono font-bold text-white tracking-tighter", 'aria-live': "polite" }, formatTime(timeLeft))
        ),
        e('div', { className: "flex justify-center space-x-2 mb-6" },
            [1, 5, 10, 15].map(min => 
                e('button', { key: min, onClick: () => handleSetTime(min * 60), className: "px-4 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-full text-sm disabled:opacity-50 transition-all transform active:scale-95", disabled: isRunning },
                    `${min}m`
                )
            )
        ),
        e('div', { className: "grid grid-cols-2 gap-4" },
            e(Button, { onClick: isRunning ? stopTimer : startTimer, className: isRunning ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-500 hover:bg-blue-600' }, isRunning ? 'Pause' : 'Start'),
            e(Button, { onClick: resetTimer, className: "bg-gray-600 hover:bg-gray-700" }, 'Reset')
        )
    );
};

const WeatherView = () => {
    const [weather, setWeather] = useState(null);
    const [sources, setSources] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cityInput, setCityInput] = useState('');

    const getLocationAndWeather = useCallback(() => {
        setLoading(true);
        setError(null);
        setWeather(null);
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        const { weatherData, sources } = await fetchWeather(position.coords.latitude, position.coords.longitude);
                        setWeather(weatherData);
                        setSources(sources);
                    } catch (e) {
                        setError(e.message || 'An unknown error occurred.');
                         if (e.message.includes("API key")) {
                            setError("Weather service is disabled. API key not found.");
                        }
                    } finally {
                        setLoading(false);
                    }
                },
                (err) => {
                    setLoading(false);
                    switch (err.code) {
                        case err.PERMISSION_DENIED:
                            setError('Location permission denied. You can manually search for a city below.');
                            break;
                        case err.POSITION_UNAVAILABLE:
                            setError('Location information is unavailable. Please check your connection or try again.');
                            break;
                        case err.TIMEOUT:
                            setError('The request to get user location timed out. Please try again.');
                            break;
                        default:
                            setError('An unknown error occurred while fetching your location.');
                            break;
                    }
                }
            );
        } else {
            setError('Geolocation is not supported by your browser.');
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        getLocationAndWeather();
    }, [getLocationAndWeather]);

    const handleCitySearch = async (event) => {
        event.preventDefault();
        if (!cityInput.trim()) return;
        
        setLoading(true);
        setError(null);
        setWeather(null);
        
        try {
            const { weatherData, sources } = await fetchWeatherByCity(cityInput);
            setWeather(weatherData);
            setSources(sources);
        } catch (e) {
            setError(e.message || `Could not find weather for "${cityInput}".`);
        } finally {
            setLoading(false);
        }
    };

    return e(Card, { title: "Today's Weather", icon: e(Icon, null, ICONS.SUN) },
        loading && e('p', { className: "text-center text-gray-400 animate-pulse" }, "Fetching weather data..."),
        
        error && !loading && e('div', { className: "text-center space-y-4" },
            e('p', { className: "text-red-400" }, error),
            e(Button, { onClick: getLocationAndWeather, className: "bg-blue-500 hover:bg-blue-600 mx-auto" }, "Use My Location")
        ),

        weather && !loading && e('div', { className: "flex flex-col items-center text-center animate-[fade-in_0.5s_ease-in-out]" },
            e('h3', { className: "text-3xl font-bold" }, weather.city),
            e('div', { className: "text-8xl my-4 flex items-start" },
                e('span', { className: "mt-2" }, weather.icon),
                e('span', { className: "ml-4 font-bold" }, `${Math.round(weather.temperature)}°C`)
            ),
            e('p', { className: "text-2xl text-gray-300 capitalize" }, weather.condition),
            e('div', { className: "mt-6 w-full text-left grid grid-cols-2 gap-4 text-sm" },
                e('p', null, e('span', { className: "font-semibold text-gray-400" }, "Humidity:"), ` ${weather.humidity}%`),
                e('p', null, e('span', { className: "font-semibold text-gray-400" }, "Wind:"), ` ${weather.windSpeed} km/h`)
            ),
            sources.length > 0 && e('div', { className: "mt-4 w-full text-left text-xs text-gray-500" },
                e('p', { className: "font-semibold mb-1" }, "Sources:"),
                sources.map((source, i) => 
                    e('a', { key: i, href: source.web.uri, target: "_blank", rel: "noopener noreferrer", className: "block truncate hover:underline text-blue-400" },
                        source.web.title || source.web.uri
                    )
                )
            )
        ),

        !loading && e('div', { className: "mt-6 pt-6 border-t border-white/10" },
            e('form', { onSubmit: handleCitySearch, className: "flex gap-2" },
                e('input', {
                    type: "text",
                    value: cityInput,
                    onChange: (e) => setCityInput(e.target.value),
                    placeholder: "Or search for a city...",
                    className: "flex-grow bg-gray-800 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors",
                    'aria-label': "Search for a city"
                }),
                e(Button, {
                    type: "submit",
                    className: "bg-green-500 hover:bg-green-600 shrink-0",
                    disabled: !cityInput.trim()
                }, "Search")
            )
        )
    );
};

// --- Main App Component ---

export default function App() {
  const orientation = useOrientation();
  const [previewView, setPreviewView] = useState('initial');
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 5000); // 5 seconds
    return () => clearTimeout(timer);
  }, []);
  
  const getView = (key) => {
      switch (key) {
        case 'portrait-primary': return e(AlarmView);
        case 'landscape-primary': return e(StopwatchView);
        case 'portrait-secondary': return e(TimerView);
        case 'landscape-secondary': return e(WeatherView);
        default: return e(HomeView);
      }
  }

  const previewOptions = [
    { key: 'initial', label: 'Home' },
    { key: 'portrait-primary', label: 'Alarm' },
    { key: 'landscape-primary', label: 'Stopwatch' },
    { key: 'portrait-secondary', label: 'Timer' },
    { key: 'landscape-secondary', label: 'Weather' },
  ];

  return e('main', { className: "relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden pt-20" },
    e('div', { className: "absolute inset-0 -z-10 h-full w-full bg-gray-900 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem]" },
        e('div', { className: "absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_500px_at_50%_200px,#3b82f633,transparent)]" })
    ),
    e(WelcomeView, { show: showWelcome }),
    e('div', { className: `w-full h-full flex flex-col items-center justify-center transition-opacity duration-700 ${showWelcome ? 'opacity-0 pointer-events-none' : 'opacity-100'}` },
        e('div', { className: "fixed top-4 left-1/2 -translate-x-1/2 z-20 bg-black/60 backdrop-blur-md p-2 rounded-2xl shadow-lg border border-white/10 flex items-center space-x-1 sm:space-x-2 flex-wrap justify-center" },
            e('span', { className: "text-sm font-semibold text-gray-300 px-2 hidden sm:block" }, "Preview:"),
            previewOptions.map(option => 
                e('button', {
                    key: option.key,
                    onClick: () => setPreviewView(option.key),
                    className: `px-3 sm:px-4 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${previewView === option.key ? 'bg-blue-500 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-200'}`
                }, option.label)
            )
        ),
        e('div', { key: previewView, className: "animate-[fade-in_0.5s_ease-in-out]" },
            getView(previewView)
        ),
        e('div', { className: "fixed bottom-4 left-4 right-4 text-center text-xs text-gray-500 bg-black/50 p-2 rounded-lg max-w-md mx-auto flex items-center justify-center space-x-2 backdrop-blur-sm z-20" },
            e(Icon, { className: "w-4 h-4 flex-shrink-0" }, ICONS.INFO),
            e('span', null, "On iOS/iPadOS, disable Portrait Orientation Lock for all features.")
        )
    )
  );
}
