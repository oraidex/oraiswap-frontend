import defaultTokenIcon from 'assets/icons/tokens.svg';
import React from 'react';

type TokenIconProps = React.ImgHTMLAttributes<HTMLImageElement>;

/** Displays the local default token icon when a token image URL is unavailable or fails to load. */
const TokenIcon: React.FC<TokenIconProps> = ({ onError, ...props }) => {
  const handleError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget;

    // Prevent an infinite loop if the fallback asset itself cannot be loaded.
    image.onerror = null;
    image.src = defaultTokenIcon;
    onError?.(event);
  };

  return <img {...props} onError={handleError} />;
};

export default TokenIcon;
