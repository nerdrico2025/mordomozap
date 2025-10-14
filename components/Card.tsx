
import React from 'react';

// FIX: Extend props to include standard HTML attributes to allow passing props like onClick.
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    // FIX: Spread additional props to the underlying div.
    <div className={`bg-white rounded-xl shadow-lg p-6 md:p-8 ${className}`} {...props}>
      {children}
    </div>
  );
};

export default Card;
