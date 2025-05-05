import React from 'react';

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  title?: string;
};

export default function Card({ title, children, className = '', ...props }: CardProps) {
  return (
    <div className={[ 'bg-white p-4 rounded-lg shadow', className ].filter(Boolean).join(' ')} {...props}>
      {title && <h3 className="text-lg font-medium mb-2">{title}</h3>}
      {children}
    </div>
  );
}
