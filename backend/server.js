const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const mongoURI = 'mongodb+srv://kainatjamal2:mAgl60QCzwfZIfLC@cluster1.sk5cr.mongodb.net/ChatAppDB';
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// Message schema and model
const messageSchema = new mongoose.Schema({
    content: String,
    isSentByUser: Boolean,
    topic: String,
    createdAt: { type: Date, default: Date.now },
});

const Message = mongoose.model('Message', messageSchema);

// Routes

// Get messages by topic
app.get('/messages', async (req, res) => {
    const { topic } = req.query;
    const query = topic ? { topic } : {};
    try {
        const messages = await Message.find(query).sort({ createdAt: 1 });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching messages', error });
    }
});

// Add a new message
app.post('/messages', async (req, res) => {
    const { content, isSentByUser, topic } = req.body;

    try {
        const newMessage = new Message({ content, isSentByUser, topic });
        await newMessage.save();
        res.status(201).json(newMessage);
    } catch (error) {
        res.status(500).json({ message: 'Error saving message', error });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

