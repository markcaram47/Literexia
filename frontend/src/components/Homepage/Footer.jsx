import React from "react";
import literexiaLogo from "../../assets/images/Teachers/LITEREXIA.png"; 
import "../../components/Homepage/Footer.css";

function Footer() {
  return (
    <footer className="footer-section">
      <div className="footer-bottom">
        <img 
          src={literexiaLogo} 
          alt="LITEREXIA Logo" 
          className="footer-logo"
        />
        <p className="footer-rights">All rights reserved</p>
      </div>
    </footer>
  );
}

export default Footer;