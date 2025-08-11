const useOrientation = (): Orientation => {
  const getOrientation = (): Orientation => {
    if (typeof window === 'undefined') return 'unknown';

    if (window.screen && window.screen.orientation) {
      const { type, angle } = window.screen.orientation;
      if (type) {
        if (type.startsWith('portrait')) return type;
        if (type.startsWith('landscape')) return type;
      }
      switch (angle) {
        case 0: return 'portrait-primary';
        case 90: return 'landscape-primary';
        case 180: return 'portrait-secondary';
        case 270: return 'landscape-secondary';
      }
    }

    // Fallback for iOS Safari
    const angle = window.orientation as number;
    switch (angle) {
      case 0: return 'portrait-primary';
      case 90: return 'landscape-primary';
      case 180: return 'portrait-secondary';
      case -90: return 'landscape-secondary';
      default: return 'unknown';
    }
  };

  const [orientation, setOrientation] = React.useState<Orientation>(getOrientation());

  React.useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(getOrientation());
    };

    // Modern browsers
    if (window.screen && window.screen.orientation) {
      window.screen.orientation.addEventListener('change', handleOrientationChange);
    }

    // Fallback for iOS Safari & older devices
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('deviceorientation', handleOrientationChange);

    return () => {
      if (window.screen && window.screen.orientation) {
        window.screen.orientation.removeEventListener('change', handleOrientationChange);
      }
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('deviceorientation', handleOrientationChange);
    };
  }, []);

  return orientation;
};
