import React, { useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { Orientation, WeatherData, GroundingSource } from './types';
import { ICONS } from './constants';
import { fetchWeatherByCoords, fetchWeatherByCity } from './services/geminiService';

// --- Custom Hook for Orientation ---
const useOrientation = (): Orientation => {
  const getOrientation = useCallback((): Orientation => {
    if (typeof window === 'undefined' || !window.screen || !window.screen.orientation) {
      return 'unknown';
    }
    const { type } = window.screen.orientation;
    if (type.startsWith('portrait')) return type;
    if (type.startsWith('landscape')) return type;

    // Fallback for browsers that only support angle
    const { angle } = window.screen.orientation;
     switch (angle) {
      case 0: return 'portrait-primary';
      case 90: return 'landscape-primary';
      case 180: return 'portrait-secondary';
      case 270: return 'landscape-secondary';
      default: return 'unknown';
    }
  }, []);

  const [orientation, setOrientation] = useState<Orientation>(getOrientation());

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

const Icon = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`}>
    {children}
  </svg>
);

const Card = ({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) => (
  <div className="w-full max-w-sm mx-auto bg-black/30 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/10">
    <div className="p-5 border-b border-white/10 flex items-center space-x-4">
      <div className="text-blue-400">{icon}</div>
      <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

// --- View Components ---

const GuideView = () => (
  <Card title="Welcome to Orient All" icon={<Icon>{ICONS.ROTATE}</Icon>}>
    <div className="space-y-4">
      <p className="text-center text-gray-300">Rotate your device to access different tools. Use the <Icon className="inline w-4 h-4" children={ICONS.INFO} /> icon to see this guide again.</p>
      <ul className="space-y-3 pt-2 text-white">
        <li className="flex items-center space-x-4">
          <Icon className="text-blue-400 w-8 h-8">{ICONS.ALARM}</Icon>
          <div><span className="font-semibold block">Portrait (Upright)</span> <span className="text-gray-300">Alarm Clock</span></div>
        </li>
        <li className="flex items-center space-x-4">
          <Icon className="text-blue-400 w-8 h-8">{ICONS.STOPWATCH}</Icon>
          <div><span className="font-semibold block">Landscape (Left)</span> <span className="text-gray-300">Stopwatch</span></div>
        </li>
         <li className="flex items-center space-x-4">
          <Icon className="text-blue-400 w-8 h-8">{ICONS.TIMER}</Icon>
          <div><span className="font-semibold block">Portrait (Upside-Down)</span> <span className="text-gray-300">Timer</span></div>
        </li>
         <li className="flex items-center space-x-4">
          <Icon className="text-blue-400 w-8 h-8">{ICONS.SUN}</Icon>
          <div><span className="font-semibold block">Landscape (Right)</span> <span className="text-gray-300">Weather</span></div>
        </li>
      </ul>
    </div>
  </Card>
);

const AlarmView = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [alarmTime, setAlarmTime] = useState('');
    const [isAlarmSet, setIsAlarmSet] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

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

    return (
        <Card title="Alarm Clock" icon={<Icon>{ICONS.ALARM}</Icon>}>
            <div className="text-center">
                <p className="text-6xl font-mono font-bold text-white tracking-wider">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                <p className="text-lg text-gray-400">{currentTime.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <div className="mt-8 flex flex-col items-center space-y-4">
                <input
                    type="time"
                    value={alarmTime}
                    onChange={(e) => setAlarmTime(e.target.value)}
                    className="bg-gray-700 border border-gray-600 rounded-lg p-2 text-white w-full max-w-xs text-center"
                    disabled={isAlarmSet}
                    aria-label="Set alarm time"
                />
                <button
                    onClick={() => setIsAlarmSet(!isAlarmSet)}
                    disabled={!alarmTime}
                    className={`px-6 py-3 rounded-lg font-semibold text-white transition-all w-full max-w-xs ${isAlarmSet ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed'}`}
                >
                    {isAlarmSet ? `Stop Alarm (${alarmTime})` : 'Set Alarm'}
                </button>
            </div>
        </Card>
    );
};


const StopwatchView = () => {
    const [time, setTime] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [laps, setLaps] = useState<number[]>([]);
    const timerRef = useRef<number | null>(null);

    const formatTime = (time: number) => {
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
            setLaps([time, ...laps]);
        }
    };
    
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    return (
        <Card title="Stopwatch" icon={<Icon>{ICONS.STOPWATCH}</Icon>}>
            <div className="text-center mb-6">
                <p className="text-7xl font-mono font-bold text-white tracking-wider">{formatTime(time)}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
                <button onClick={isRunning ? stop : start} className={`py-3 rounded-lg font-semibold text-white transition-all ${isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}>
                    {isRunning ? 'Stop' : 'Start'}
                </button>
                <button onClick={lap} disabled={!isRunning} className="py-3 bg-gray-600 hover:bg-gray-700 rounded-lg font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    Lap
                </button>
            </div>
             <div className="text-center">
                <button onClick={reset} className="text-gray-400 hover:text-white">Reset</button>
            </div>
            <div className="mt-4 max-h-32 overflow-y-auto space-y-2 pr-2">
                {laps.map((lapTime, index) => (
                    <div key={index} className="flex justify-between items-center bg-gray-800/50 p-2 rounded-md text-sm">
                        <span className="font-medium text-gray-400">Lap {laps.length - index}</span>
                        <span className="font-mono text-white">{formatTime(lapTime - (laps[index+1] || 0))}</span>
                    </div>
                ))}
            </div>
        </Card>
    );
};

const TimerView = () => {
    const [initialTime, setInitialTime] = useState(300); // 5 minutes
    const [timeLeft, setTimeLeft] = useState(initialTime);
    const [isRunning, setIsRunning] = useState(false);
    const timerRef = useRef<number | null>(null);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    const startTimer = useCallback(() => {
        if (timeLeft <= 0) return;
        setIsRunning(true);
        const endTime = Date.now() + timeLeft * 1000;
        timerRef.current = window.setInterval(() => {
            const newTimeLeft = Math.round((endTime - Date.now()) / 1000);
            if (newTimeLeft <= 0) {
                setTimeLeft(0);
                setIsRunning(false);
                if(timerRef.current) clearInterval(timerRef.current);
                alert("Time's up!");
            } else {
                setTimeLeft(newTimeLeft);
            }
        }, 1000);
    }, [timeLeft]);

    const stopTimer = () => {
        setIsRunning(false);
        if(timerRef.current) clearInterval(timerRef.current);
    };

    const resetTimer = () => {
        stopTimer();
        setTimeLeft(initialTime);
    };
    
    const handleSetTime = (seconds: number) => {
        if(isRunning) return;
        setInitialTime(seconds);
        setTimeLeft(seconds);
    }
    
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    return (
        <Card title="Timer" icon={<Icon>{ICONS.TIMER}</Icon>}>
            <div className="text-center mb-6">
                 <p className="text-7xl font-mono font-bold text-white tracking-wider">{formatTime(timeLeft)}</p>
            </div>
             <div className="flex justify-center space-x-2 mb-6">
                {[1, 5, 15, 30].map(min => (
                    <button key={min} onClick={() => handleSetTime(min * 60)} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-full text-sm disabled:opacity-50" disabled={isRunning}>
                        {min}m
                    </button>
                ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
                <button onClick={isRunning ? stopTimer : startTimer} className={`py-3 rounded-lg font-semibold text-white transition-all ${isRunning ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-500 hover:bg-blue-600'}`}>
                    {isRunning ? 'Pause' : 'Start'}
                </button>
                 <button onClick={resetTimer} className="py-3 bg-gray-600 hover:bg-gray-700 rounded-lg font-semibold text-white transition-all">
                    Reset
                </button>
            </div>
        </Card>
    );
};

const WeatherView = () => {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [sources, setSources] = useState<GroundingSource[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [city, setCity] = useState('');

    const handleFetchWeather = async (fetcher: () => Promise<{ weatherData: WeatherData; sources: GroundingSource[] }>) => {
        setLoading(true);
        setError(null);
        setWeather(null);
        setSources([]);
        try {
            const { weatherData, sources } = await fetcher();
            setWeather(weatherData);
            setSources(sources);
        } catch (e: unknown) {
            if (e instanceof Error) {
                setError(e.message);
            } else {
                setError('An unknown server error occurred.');
            }
        } finally {
            setLoading(false);
        }
    };
    
    const searchByCity = (e: React.FormEvent) => {
        e.preventDefault();
        if (!city.trim()) {
            setError("Please enter a city name.");
            return;
        }
        handleFetchWeather(() => fetchWeatherByCity(city));
    };

    const searchByLocation = () => {
        setLoading(true);
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    handleFetchWeather(() => fetchWeatherByCoords(position.coords.latitude, position.coords.longitude));
                },
                (err) => {
                    setError('Geolocation permission denied. Please enable it in your browser settings or search for a city.');
                    setLoading(false);
                }
            );
        } else {
            setError('Geolocation is not supported by your browser.');
            setLoading(false);
        }
    };

    const SearchInterface = () => (
        <div className="space-y-4 animate-[fade-in_0.3s_ease-in-out]">
            <button
                onClick={searchByLocation}
                className="w-full px-6 py-3 rounded-lg font-semibold text-white transition-all bg-blue-500 hover:bg-blue-600"
            >
                Use My Location
            </button>
            <form onSubmit={searchByCity} className="flex gap-2">
                <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Or enter a city..."
                    className="flex-grow bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    aria-label="City name"
                />
                <button
                    type="submit"
                    className="px-6 py-3 rounded-lg font-semibold text-white transition-all bg-green-500 hover:bg-green-600"
                    aria-label="Search"
                >
                    Search
                </button>
            </form>
        </div>
    );
    
    const WeatherDisplay = () => weather && (
         <div className="flex flex-col items-center text-center animate-[fade-in_0.3s_ease-in-out]">
            <h3 className="text-3xl font-bold">{weather.city}</h3>
            <div className="text-8xl my-4 flex items-start">
                <span>{weather.icon}</span>
                <span className="ml-4 font-bold">{Math.round(weather.temperature)}°C</span>
            </div>
            <p className="text-2xl text-gray-300">{weather.condition}</p>
            <div className="mt-6 w-full text-left grid grid-cols-2 gap-4 text-sm">
                <p><span className="font-semibold text-gray-400">Humidity:</span> {weather.humidity}%</p>
                <p><span className="font-semibold text-gray-400">Wind:</span> {weather.windSpeed} km/h</p>
            </div>
            {sources.length > 0 && (
                <div className="mt-4 w-full text-left text-xs text-gray-500">
                     <p className="font-semibold mb-1">Sources:</p>
                    {sources.map((source, i) => (
                        <a key={i} href={source.web.uri} target="_blank" rel="noopener noreferrer" className="block truncate hover:underline">
                            {source.web.title || source.web.uri}
                        </a>
                    ))}
                </div>
            )}
             <button 
                onClick={() => { setWeather(null); setCity(''); setError(null); }} 
                className="mt-6 text-blue-400 hover:text-blue-300"
            >
                Search for another city
            </button>
        </div>
    );

    return (
        <Card title="Today's Weather" icon={<Icon>{ICONS.SUN}</Icon>}>
            {loading && <p className="text-center text-gray-400">Fetching weather data...</p>}
            
            {error && !loading && (
                <div className="text-center animate-[fade-in_0.3s_ease-in-out]">
                    <p className="text-red-400 mb-4">{error}</p>
                    <button 
                        onClick={() => { setError(null); setCity(''); }} 
                        className="text-blue-400 hover:text-blue-300"
                    >
                        Try again
                    </button>
                </div>
            )}

            {!loading && !error && !weather && <SearchInterface />}
            {!loading && !error && weather && <WeatherDisplay />}
        </Card>
    );
};

// --- Main App Component ---

export default function App() {
  const orientation = useOrientation();
  const [view, setView] = useState<ReactNode>(<GuideView />);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isHelpVisible, setIsHelpVisible] = useState(false);

  useEffect(() => {
    if (isInitialLoad && orientation !== 'unknown') {
      setIsInitialLoad(false);
    }
    
    if (isInitialLoad || isHelpVisible) return;

    let newView;
    switch (orientation) {
      case 'portrait-primary':
        newView = <AlarmView />;
        break;
      case 'landscape-primary':
        newView = <StopwatchView />;
        break;
      case 'portrait-secondary':
        newView = <TimerView />;
        break;
      case 'landscape-secondary':
        newView = <WeatherView />;
        break;
      default:
        newView = <GuideView />;
        break;
    }
    setView(newView);
  }, [orientation, isInitialLoad, isHelpVisible]);

  const HelpModal = () => (
    <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-[fade-in_0.2s_ease-in-out]"
        onClick={() => setIsHelpVisible(false)}
        role="dialog"
        aria-modal="true"
    >
        <div onClick={e => e.stopPropagation()}>
            <GuideView />
        </div>
    </div>
  );

  return (
    <main className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 -z-10 h-full w-full bg-gray-900 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem]">
            <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_500px_at_50%_200px,#3b82f633,transparent)]"></div>
        </div>

        {/* View Container with Transition */}
        <div key={isInitialLoad ? 'initial' : orientation} className="animate-[fade-in_0.5s_ease-in-out]">
            {view}
        </div>
        
        {/* Help Button */}
        <button 
            onClick={() => setIsHelpVisible(true)}
            className="fixed top-4 right-4 z-40 w-12 h-12 bg-black/30 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center text-gray-300 hover:text-white hover:border-white/20 transition-all"
            aria-label="Show help"
        >
            <Icon>{ICONS.INFO}</Icon>
        </button>

        {isHelpVisible && <HelpModal />}
        
        {/* iOS Orientation Lock Info */}
        <div className="fixed bottom-4 left-4 right-4 text-center text-xs text-gray-500 bg-black/50 p-2 rounded-lg max-w-md mx-auto flex items-center justify-center space-x-2">
            <Icon className="w-4 h-4">{ICONS.INFO}</Icon>
            <span>On iOS/iPadOS, ensure Portrait Orientation Lock is disabled in Control Center for this app to work.</span>
        </div>
    </main>
  );
}
