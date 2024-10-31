import { useState, useEffect } from 'react';

const ZappingText = ({ text, timer = 500, dot = 3 }: { dot?: number; text?: string; timer?: number }) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prevDots) => {
        if (prevDots.length < dot) {
          return prevDots + '.';
        } else {
          return '';
        }
      });
    }, timer);

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <p>
        {text}
        {dots}
      </p>
    </div>
  );
};

export default ZappingText;
