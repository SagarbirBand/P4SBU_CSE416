// app/components/BGIMG.tsx
import React from 'react';

type BGIMGProps = {
  url: string;
};

const BGIMG = ({ url }: BGIMGProps) => {
  return (
    <div
      className="absolute inset-0 bg-cover bg-center"
      style={{ backgroundImage: `url('${url}')`, opacity: 0.25 }}
    />
  );
};

export default BGIMG;
