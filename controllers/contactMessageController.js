const ContactMessage = require('../models/contactMessageModel');
const sendEmail = require('../utils/sendEmail');

// Submit a new contact message
exports.submitMessage = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;
    
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Name, email, and message are required' });
    }

    const newMessage = await ContactMessage.createMessage({ name, email, subject, message });
    
    // Emit real-time event to Admin/Receptionist dashboard
    const io = req.app.get('io');
    console.log('Is IO available?', !!io);
    if (io) {
      console.log('Emitting new_contact_message to all clients');
      io.emit('new_contact_message', newMessage);
    }
    
    res.status(201).json({
      success: true,
      message: 'Your message has been sent successfully',
      data: newMessage
    });
  } catch (error) {
    next(error);
  }
};

// Get all messages (for admin/receptionist)
exports.getMessages = async (req, res, next) => {
  try {
    const messages = await ContactMessage.getAllMessages();
    
    res.status(200).json({
      success: true,
      data: messages
    });
  } catch (error) {
    next(error);
  }
};

// Mark message as read
exports.markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedMessage = await ContactMessage.markAsRead(id);
    
    if (!updatedMessage) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }
    
    res.status(200).json({
      success: true,
      message: 'Message marked as read',
      data: updatedMessage
    });
  } catch (error) {
    next(error);
  }
};

// Delete a message
exports.deleteMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deletedMessage = await ContactMessage.deleteMessage(id);
    
    if (!deletedMessage) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }
    
    res.status(200).json({
      success: true,
      message: 'Message deleted successfully',
      data: deletedMessage
    });
  } catch (error) {
    next(error);
  }
};

// Reply to a message
exports.replyMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { replyText, email, subject } = req.body;
    
    if (!replyText || !email) {
      return res.status(400).json({ success: false, message: 'Reply text and email are required' });
    }
    
    await sendEmail(email, `Re: ${subject || 'Your Contact Request'} - CareSync`, replyText);
    await ContactMessage.markAsRead(id);
    
    res.status(200).json({ success: true, message: 'Reply sent successfully' });
  } catch (error) {
    next(error);
  }
};
