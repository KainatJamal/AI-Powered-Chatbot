// App.js
import React from 'react';
import ChatWindow from './components/ChatWindow'; // Adjust path based on your project structure
import './styles/styles.css'; // Global styles for the app


const App = () => {
    return (
        <div className="app-container">
            <ChatWindow />
        </div>
    );
};

export default App;
