import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import '../styles/styles.css';
import Logo from '../components/Untitled_design-removebg-preview.png';
import Logo1 from '../components/Untitled_design__1_-removebg-preview.png';

// Sidebar component
const Sidebar = ({ currentTopic, chatHistory, onDeleteTopic, onTopicClick }) => {
    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <img src={Logo} alt="Logo" className="sidebar-logo" />
                <h2>AI-Powered ChatBot</h2>
            </div>
            <h4>Current Chat</h4>
            <p>{currentTopic || "No current topic"}</p>
            <h4>Chat History</h4>
            <ul>
                {Array.isArray(chatHistory) && chatHistory.map((topic, index) => (
                    <li key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span onClick={() => onTopicClick(topic)} style={{ cursor: 'pointer' }}>{topic}</span>
                        <button onClick={() => onDeleteTopic(index)} style={{ marginLeft: '8px', cursor: 'pointer', background: 'none', border: 'none', color: 'red', fontSize: '16px' }}>
                            🗑️
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

// Messages component
const Messages = ({ messages }) => {
    const endOfMessagesRef = useRef(null);

    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="messages-container">
            {messages.map((message, index) => (
                <div key={index} className={`message ${message.isSentByUser ? 'sent' : 'received'}`}>
                    {!message.isSentByUser && (
                        <div className="received-message-icon" style={{ display: 'flex', alignItems: 'center' }}>
                            <img
                                src={Logo1}
                                alt="Logo"
                                style={{ width: '20px', height: '20px', marginRight: '8px' }}
                            />
                            <div className="received-message-container">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                            </div>
                        </div>
                    )}
                    {message.isSentByUser && (
                        <div className="sent-message-container">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                    )}
                </div>
            ))}
            <div ref={endOfMessagesRef} />
        </div>
    );
};

// MessageInput component
const MessageInput = ({ onSendMessage, generatingAnswer }) => {
    const [message, setMessage] = useState('');

    const handleSendMessage = () => {
        if (message.trim()) {
            onSendMessage({ content: message, isSentByUser: true });
            setMessage('');
        } else {
            alert('Message cannot be empty');
        }
    };

    return (
        <div className="message-input">
            <input
                type="text"
                placeholder="Type..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={generatingAnswer}
            />
            <button onClick={handleSendMessage} disabled={generatingAnswer}>
                {generatingAnswer ? 'Generating...' : 'Send'}
            </button>
        </div>
    );
};

// Main ChatWindow component
const ChatWindow = () => {
    const [messages, setMessages] = useState([]);
    const [chatHistory, setChatHistory] = useState(() => {
        const savedHistory = localStorage.getItem('chatHistory');
        if (savedHistory) {
            try {
                const parsedHistory = JSON.parse(savedHistory);
                return Array.isArray(parsedHistory) ? parsedHistory : [];
            } catch (error) {
                console.error('Error parsing chat history from localStorage:', error);
                return [];
            }
        }
        return [];
    });
    const [generatingAnswer, setGeneratingAnswer] = useState(false);
    const [initialTopic, setInitialTopic] = useState('');

    const generateAnswer = async (question) => {
        setGeneratingAnswer(true);
        const loadingMessage = { content: "Loading...", isSentByUser: false };
        setMessages((prevMessages) => [...prevMessages, loadingMessage]);

        try {
            const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=AIzaSyCAtizHsZUAiiWqZW8zkq1XI6G_V3E7W2s`, {
                contents: [{ parts: [{ text: question }] }],
            });

            const aiMessage = response?.data?.candidates[0]?.content?.parts[0]?.text || 'AI failed to respond';

            setMessages((prevMessages) =>
                prevMessages.filter(msg => msg !== loadingMessage).concat({ content: aiMessage, isSentByUser: false })
            );

            await axios.post('http://localhost:5000/messages', { content: aiMessage, isSentByUser: false, topic: initialTopic || 'General' });
        } catch (error) {
            console.error('Error generating response:', error);
            setMessages((prevMessages) =>
                prevMessages.filter(msg => msg !== loadingMessage).concat({ content: 'Sorry - Something went wrong. Please try again!', isSentByUser: false })
            );
        }

        setGeneratingAnswer(false);
    };

    const onSendMessage = async (newMessage) => {
        setMessages((prevMessages) => [...prevMessages, newMessage]);

        // Set the initial topic if this is the first message
        if (messages.length === 0 && newMessage.isSentByUser) {
            setInitialTopic(newMessage.content);
            setChatHistory((prevHistory) => {
                const updatedHistory = [newMessage.content, ...prevHistory];
                localStorage.setItem('chatHistory', JSON.stringify(updatedHistory));
                return updatedHistory;
            });
        }

        try {
            await axios.post('http://localhost:5000/messages', {
                ...newMessage,
                topic: initialTopic || 'General', // Use the current topic
            });

            if (newMessage.isSentByUser) {
                generateAnswer(newMessage.content);
            }
        } catch (error) {
            console.error('Error sending message to the backend:', error);
        }

        // Save messages to local storage
        localStorage.setItem('messages', JSON.stringify([...messages, newMessage]));
    };

    const fetchMessagesForTopic = async (topic) => {
        try {
            const response = await axios.get(`http://localhost:5000/messages?topic=${topic}`);
            if (response.data) {
                setMessages(response.data); // Update state with all messages for the selected topic
                setInitialTopic(topic); // Set the current topic
            }
        } catch (error) {
            console.error('Error fetching messages for topic:', error);
        }
    };

    const onDeleteTopic = (index) => {
        const updatedHistory = chatHistory.filter((_, i) => i !== index);
        setChatHistory(updatedHistory);
        localStorage.setItem('chatHistory', JSON.stringify(updatedHistory));

        if (index === 0) {
            resetChat();
        }
    };

    const resetChat = () => {
        setMessages([]);
        setInitialTopic('');
    };

    const handleTopicClick = (topic) => {
        fetchMessagesForTopic(topic);
    };

    return (
        <div className="chat-app-container">
            <Sidebar currentTopic={initialTopic} chatHistory={chatHistory} onDeleteTopic={onDeleteTopic} onTopicClick={handleTopicClick} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div className="chat-window">
                    <div className="chat-header">
                        <button onClick={resetChat}>+</button>
                    </div>
                    {messages.length === 0 ? (
                        <div className="tagline-container">
                            <h3>Conversational Intelligence, Simplified.</h3>
                            <p>Instant answers, personalized experiences – powered by advanced AI to elevate your interactions.</p>
                        </div>
                    ) : (
                        <Messages messages={messages} />
                    )}
                </div>
                <MessageInput onSendMessage={onSendMessage} generatingAnswer={generatingAnswer} />
            </div>
        </div>
    );
};

export default ChatWindow;
