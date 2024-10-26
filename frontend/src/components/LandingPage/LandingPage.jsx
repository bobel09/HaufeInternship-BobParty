import './LandingPage.css';
import { Link } from 'react-router-dom';

function LandingPage() {
  return (
    <div className="landing-page">
      <div className="landing-content">
        <h1 className="landing-title">Welcome to BobParty!</h1>
        <p className="landing-subtitle">Enjoy the parties and have fun!!!</p>
        <div className="landing-buttons">
          <Link to="/login" className="landing-btn landing-login-btn">Log In</Link>
          <Link to="/signup" className="landing-btn landing-signup-btn">Sign Up</Link>
        </div>
      </div>
      <div className="landing-background">
        <div className="landing-chat-bubble landing-chat-bubble1"></div>
        <div className="landing-chat-bubble landing-chat-bubble2"></div>
        <div className="landing-chat-bubble landing-chat-bubble3"></div>
      </div>
    </div>
  );
}

export default LandingPage;
