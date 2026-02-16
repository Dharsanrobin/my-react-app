import React from 'react';
import { useNavigate } from 'react-router-dom';

interface BackButtonProps {
  className?: string;
  children?: React.ReactNode;
}

const BackButton: React.FC<BackButtonProps> = ({ 
  className = "", 
  children = "← Back" 
}) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      className={`inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-slate-200 ${className}`}
    >
      {children}
    </button>
  );
};

export default BackButton;