import { useState, useRef, useEffect } from "react";
import "./Navbar.css";

interface NavButton {
  label: string;
  action: string;
}

interface NavbarProps {
  buttons: NavButton[];
  onNavClick: (action: string) => void;
}

function Navbar({ buttons, onNavClick }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleButtonClick = (action: string) => {
    onNavClick(action);
    setIsOpen(false);
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="navbar">
      <button className="hamburger" onClick={toggleMenu} aria-label="Menu">
        <span className={`hamburger-line ${isOpen ? "open" : ""}`}></span>
        <span className={`hamburger-line ${isOpen ? "open" : ""}`}></span>
        <span className={`hamburger-line ${isOpen ? "open" : ""}`}></span>
      </button>
      <div className={`nav-links ${isOpen ? "open" : ""}`} ref={menuRef}>
        {buttons.map((btn, index) => (
          <button
            key={index}
            className={`nav-button ${index === 3 ? "leyendas" : ""}`}
            onClick={() => handleButtonClick(btn.action)}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

export default Navbar;