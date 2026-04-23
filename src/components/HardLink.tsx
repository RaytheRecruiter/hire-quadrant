import React from 'react';

// Temporary workaround while SPA Link navigation is misbehaving on prod.
// Renders a real <a href> and forces a full page load on click, bypassing
// React Router's delegated click handler entirely. Drop-in for <Link to="">.
interface HardLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
  onNavigate?: () => void;
}

export const HardLink: React.FC<HardLinkProps> = ({ to, onNavigate, onClick, children, ...rest }) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) onClick(e);
    if (e.defaultPrevented) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    if (onNavigate) onNavigate();
    window.location.assign(to);
  };
  return (
    <a href={to} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
};

export default HardLink;
