import { useEffect } from 'react';
import './App.css'
import WalletConnector from './components/WalletConnector.jsx'
import serviceManager from './services/serviceManager';

function App() {

  useEffect(() => {
    console.log("Initializing services from App component");
    

    serviceManager.initialize().catch(err => {
      console.error("Failed to initialize services:", err);
    });
    

    return () => {
      serviceManager.cleanup();
    };
  }, []);

  return (
    
    <WalletConnector />
  )
}

export default App