import React from 'react';
import loadingGif from 'assets/gif/oraidex-loading.gif';

export default function LoadingPage() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}
    >
      <img alt="loading" src={loadingGif} width={180} height={180} />
    </div>
  );
}
