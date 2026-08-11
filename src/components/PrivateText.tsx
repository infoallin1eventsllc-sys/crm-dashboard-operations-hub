import React from "react";
import { useCRM } from "../context/CRMContext";

interface PrivateTextProps {
  children: React.ReactNode;
  className?: string;
  type?: "text" | "name" | "email" | "phone" | "money";
}

export const PrivateText: React.FC<PrivateTextProps> = ({ 
  children, 
  className = "", 
  type = "text" 
}) => {
  const { isPrivacyMode } = useCRM();

  if (!isPrivacyMode) {
    return <span className={className}>{children}</span>;
  }

  // If in privacy mode, render beautiful interactive blurs
  let hoverTooltip = "Privacy Active (Hover to reveal)";
  
  return (
    <span 
      title={hoverTooltip}
      className={`
        relative inline-block select-none rounded-md px-1 transition-all duration-300
        blur-[6px] hover:blur-none hover:bg-slate-100/10 dark:hover:bg-slate-800/20 cursor-help
        ${className}
      `}
    >
      {children}
    </span>
  );
};
