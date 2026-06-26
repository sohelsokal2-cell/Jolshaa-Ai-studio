import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import jwt from 'jsonwebtoken';
import { createServer as createViteServer } from 'vite';
import { createServer as createHttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { connectDB, dbService } from './database.ts';

// Load environment variables
dotenv.config();

// Configure Cloudinary
const isCloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log('☁️ Cloudinary is configured successfully.');
} else {
  console.warn('⚠️ Cloudinary is not configured. Media uploads will fall back to base64 encoding.');
}

// Set up Multer memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Stream upload helper for Cloudinary / Base64 fallback
function uploadToCloudinary(fileBuffer: Buffer, mimeType: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!isCloudinaryConfigured) {
      // Fallback: convert buffer directly to Data URI
      const base64 = fileBuffer.toString('base64');
      resolve(`data:${mimeType};base64,${base64}`);
      return;
    }
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'jolshaa_posts', resource_type: 'auto' },
      (error, result) => {
        if (error) {
          console.error('Cloudinary stream upload error:', error);
          reject(error);
        } else {
          resolve(result?.secure_url || '');
        }
      }
    );
    stream.end(fileBuffer);
  });
}

// Define custom interfaces for Express Request to handle user context
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'jolshaa_default_fallback_jwt_secret_token_key_2026';

// Parse JSON request bodies
app.use(express.json());

// Initialize database connection
connectDB();

// ==========================================
// AUTHENTICATION MIDDLEWARE
// ==========================================
export async function protect(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  let token = '';

  // Check Authorization header for bearer token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401).json({ message: 'Access denied. No authentication token provided.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    const user = await dbService.findUserById(decoded.id);
    if (!user) {
      res.status(401).json({ message: 'User not found.' });
      return;
    }
    if (user.suspended) {
      res.status(403).json({ message: 'Your account has been suspended by an administrator.' });
      return;
    }
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired authentication token.' });
  }
}

// ==========================================
// API ROUTES
// ==========================================

// GET /api/db-status - Check if running on real Mongo vs Memory DB fallback
app.get('/api/db-status', (req: Request, res: Response) => {
  res.json({
    connected: dbService.isUsingMongo(),
    type: dbService.isUsingMongo() ? 'MongoDB' : 'In-Memory DB (Development Fallback)'
  });
});

// POST /api/auth/signup - Register new user
app.post('/api/auth/signup', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone, dateOfBirth, gender } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      res.status(400).json({ message: 'Name, email, and password are required.' });
      return;
    }

    // Check if email already exists
    const existingUser = await dbService.findUserByEmail(email);
    if (existingUser) {
      res.status(400).json({ message: 'An account with this email already exists.' });
      return;
    }

    // Password validation
    if (password.length < 6) {
      res.status(400).json({ message: 'Password must be at least 6 characters long.' });
      return;
    }

    // Create user
    const newUser = await dbService.createUser({
      name,
      email,
      password,
      phone,
      dateOfBirth,
      gender
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Account registered successfully!',
      token,
      user: newUser
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Internal server error occurred during registration.' });
  }
});

// POST /api/auth/login - User Login
app.post('/api/auth/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required.' });
      return;
    }

    // Find user by email
    const userDoc = await dbService.findUserByEmail(email);
    if (!userDoc) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }

    // Verify password
    const isPasswordMatch = await dbService.verifyPassword(userDoc, password);
    if (!isPasswordMatch) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }

    // Map Mongoose document or in-memory object to sanitized user object
    const user = await dbService.findUserById(userDoc._id ? userDoc._id.toString() : userDoc.id);

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Logged in successfully!',
      token,
      user
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error occurred during login.' });
  }
});

// POST /api/auth/logout - Informational signout (stateless JWT, client discards token)
app.post('/api/auth/logout', (req: Request, res: Response) => {
  res.json({ message: 'Logged out successfully. Please discard the authentication token on the client.' });
});

// GET /api/auth/me - Retrieve current logged in user
app.get('/api/auth/me', protect as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized access.' });
      return;
    }

    const user = await dbService.findUserById(req.user.id);
    if (!user) {
      res.status(404).json({ message: 'User profile not found.' });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error retrieving your profile info.' });
  }
});

// PUT /api/users/:id - Update user profile information
app.put('/api/users/:id', protect as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!req.user || req.user.id !== id) {
      res.status(403).json({ message: 'Forbidden. You can only update your own profile information.' });
      return;
    }

    const { name, bio, phone, profilePhoto, coverPhoto, dateOfBirth, gender } = req.body;

    // Validate update details
    if (name !== undefined && name.trim() === '') {
      res.status(400).json({ message: 'Name cannot be blank.' });
      return;
    }

    const updateFields: any = {};
    if (name !== undefined) updateFields.name = name;
    if (bio !== undefined) updateFields.bio = bio;
    if (phone !== undefined) updateFields.phone = phone;
    if (profilePhoto !== undefined) updateFields.profilePhoto = profilePhoto;
    if (coverPhoto !== undefined) updateFields.coverPhoto = coverPhoto;
    if (dateOfBirth !== undefined) updateFields.dateOfBirth = dateOfBirth;
    if (gender !== undefined) updateFields.gender = gender;

    const updatedUser = await dbService.updateUser(id, updateFields);

    if (!updatedUser) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    res.json({
      message: 'Profile updated successfully!',
      user: updatedUser
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error occurred while updating profile info.' });
  }
});

// ==========================================
// POSTS, COMMENTS, AND REACTIONS API ROUTES
// ==========================================

// GET /api/users - Retrieve list of all users on Jolshaa (for tagging)
app.get('/api/users', protect as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const users = await dbService.getAllUsers();
    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error retrieving users.' });
  }
});

// POST /api/posts - Create a new post (handles media files array)
app.post('/api/posts', protect as any, upload.array('media', 5), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { text, feeling, visibility, taggedUsers } = req.body;
    
    if (!text && (!req.files || (req.files as any).length === 0)) {
      res.status(400).json({ message: 'Post text or media file is required.' });
      return;
    }

    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized.' });
      return;
    }

    // Process files
    const mediaUrls: string[] = [];
    if (req.files && (req.files as any).length > 0) {
      const files = req.files as Express.Multer.File[];
      for (const file of files) {
        try {
          const url = await uploadToCloudinary(file.buffer, file.mimetype);
          mediaUrls.push(url);
        } catch (uploadError) {
          console.error('Failed to upload file to Cloudinary:', uploadError);
        }
      }
    }

    // Parse tagged users if present (may be JSON string or array)
    let parsedTaggedUsers: string[] = [];
    if (taggedUsers) {
      try {
        parsedTaggedUsers = typeof taggedUsers === 'string' ? JSON.parse(taggedUsers) : taggedUsers;
      } catch (err) {
        parsedTaggedUsers = [];
      }
    }

    let parsedPostedIn = undefined;
    if (req.body.postedIn) {
      try {
        parsedPostedIn = typeof req.body.postedIn === 'string' ? JSON.parse(req.body.postedIn) : req.body.postedIn;
      } catch (err) {
        // ignore
      }
    }

    const newPost = await dbService.createPost({
      author: req.user.id,
      text,
      media: mediaUrls,
      feeling,
      taggedUsers: parsedTaggedUsers,
      visibility: visibility || 'public',
      postedIn: parsedPostedIn
    });

    res.status(201).json({
      message: 'Post created successfully!',
      post: newPost
    });
  } catch (error: any) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Server error creating post.' });
  }
});

// GET /api/posts/feed - Paginated Social Feed
app.get('/api/posts/feed', protect as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized.' });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 10;
    const skip = parseInt(req.query.skip as string) || 0;

    const posts = await dbService.getFeedPosts(req.user.id, limit, skip);
    res.json({ posts });
  } catch (error) {
    console.error('Get feed posts error:', error);
    res.status(500).json({ message: 'Server error retrieving feed posts.' });
  }
});

// PUT /api/posts/:id - Edit an existing post
app.put('/api/posts/:id', protect as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { text, feeling, visibility, taggedUsers, media } = req.body;
    
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized.' });
      return;
    }

    const updateData: any = {};
    if (text !== undefined) updateData.text = text;
    if (feeling !== undefined) updateData.feeling = feeling;
    if (visibility !== undefined) updateData.visibility = visibility;
    if (taggedUsers !== undefined) updateData.taggedUsers = taggedUsers;
    if (media !== undefined) updateData.media = media;

    const updatedPost = await dbService.editPost(id, req.user.id, updateData);
    
    if (!updatedPost) {
      res.status(404).json({ message: 'Post not found or you are not authorized to edit it.' });
      return;
    }

    res.json({
      message: 'Post updated successfully!',
      post: updatedPost
    });
  } catch (error: any) {
    console.error('Edit post error:', error);
    if (error.message === 'Unauthorized to edit this post') {
      res.status(403).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Server error editing post.' });
    }
  }
});

// DELETE /api/posts/:id - Delete a post
app.delete('/api/posts/:id', protect as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized.' });
      return;
    }

    const deleted = await dbService.deletePost(id, req.user.id);
    if (!deleted) {
      res.status(404).json({ message: 'Post not found or you are not authorized to delete it.' });
      return;
    }

    res.json({ message: 'Post deleted successfully!' });
  } catch (error: any) {
    console.error('Delete post error:', error);
    if (error.message === 'Unauthorized to delete this post') {
      res.status(403).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Server error deleting post.' });
    }
  }
});

// POST /api/posts/:id/react - React to a post (choose from enum / toggle)
app.post('/api/posts/:id/react', protect as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { type } = req.body; // 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry' or null to remove

    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized.' });
      return;
    }

    if (type !== null && !['like', 'love', 'haha', 'wow', 'sad', 'angry'].includes(type)) {
      res.status(400).json({ message: 'Invalid reaction type.' });
      return;
    }

    const updatedPost = await dbService.reactToPost(id, req.user.id, type);
    if (!updatedPost) {
      res.status(404).json({ message: 'Post not found.' });
      return;
    }

    res.json({
      message: type ? 'Reaction registered successfully!' : 'Reaction removed successfully!',
      post: updatedPost
    });
  } catch (error) {
    console.error('React to post error:', error);
    res.status(500).json({ message: 'Server error registering reaction.' });
  }
});

// POST /api/posts/:id/comments - Add a comment
app.post('/api/posts/:id/comments', protect as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { text, parentComment } = req.body;

    if (!text || text.trim() === '') {
      res.status(400).json({ message: 'Comment text cannot be empty.' });
      return;
    }

    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized.' });
      return;
    }

    const newComment = await dbService.addComment(id, req.user.id, text, parentComment);
    res.status(201).json({
      message: 'Comment added successfully!',
      comment: newComment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error adding comment.' });
  }
});

// GET /api/posts/:id/comments - Get comments for a post
app.get('/api/posts/:id/comments', protect as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const comments = await dbService.getPostComments(id);
    res.json({ comments });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: 'Server error retrieving comments.' });
  }
});

// DELETE /api/comments/:id - Delete a comment
app.delete('/api/comments/:id', protect as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized.' });
      return;
    }

    const deleted = await dbService.deleteComment(id, req.user.id);
    if (!deleted) {
      res.status(404).json({ message: 'Comment not found or you are not authorized to delete it.' });
      return;
    }

    res.json({ message: 'Comment deleted successfully!' });
  } catch (error: any) {
    console.error('Delete comment error:', error);
    if (error.message === 'Unauthorized to delete this comment') {
      res.status(403).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Server error deleting comment.' });
    }
  }
});

// ==========================================
// FRIEND & BLOCKING API ROUTES (Phase 3)
// ==========================================

// POST /api/friends/request/:userId - Send friend request
app.post('/api/friends/request/:userId', protect as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized.' });
      return;
    }

    const request = await dbService.sendFriendRequest(req.user.id, userId);
    res.status(201).json({
      message: 'Friend request sent successfully!',
      request
    });
  } catch (error: any) {
    console.error('Send friend request error:', error);
    res.status(400).json({ message: error.message || 'Error sending friend request.' });
  }
});

// PUT /api/friends/accept/:requestId - Accept friend request
app.put('/api/friends/accept/:requestId', protect as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { requestId } = req.params;
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized.' });
      return;
    }

    const result = await dbService.acceptFriendRequest(requestId, req.user.id);
    res.json({
      message: 'Friend request accepted!',
      result
    });
  } catch (error: any) {
    console.error('Accept friend request error:', error);
    res.status(400).json({ message: error.message || 'Error accepting friend request.' });
  }
});

// PUT /api/friends/reject/:requestId - Reject friend request
app.put('/api/friends/reject/:requestId', protect as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { requestId } = req.params;
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized.' });
      return;
    }

    const result = await dbService.rejectFriendRequest(requestId, req.user.id);
    res.json({
      message: 'Friend request rejected.',
      result
    });
  } catch (error: any) {
    console.error('Reject friend request error:', error);
    res.status(400).json({ message: error.message || 'Error rejecting friend request.' });
  }
});

// DELETE /api/friends/cancel/:requestId - Cancel friend request
app.delete('/api/friends/cancel/:requestId', protect as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { requestId } = req.params;
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized.' });
      return;
    }

    await dbService.cancelFriendRequest(requestId, req.user.id);
    res.json({ message: 'Friend request cancelled successfully.' });
  } catch (error: any) {
    console.error('Cancel friend request error:', error);
    res.status(400).json({ message: error.message || 'Error cancelling friend request.' });
  }
});

// DELETE /api/friends/unfriend/:userId - Unfriend a user
app.delete('/api/friends/unfriend/:userId', protect as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized.' });
      return;
    }

    await dbService.unfriend(req.user.id, userId);
    res.json({ message: 'Unfriended user successfully.' });
  } catch (error: any) {
    console.error('Unfriend error:', error);
    res.status(400).json({ message: error.message || 'Error unfriending user.' });
  }
});

// POST /api/users/:userId/block - Block a user
app.post('/api/users/:userId/block', protect as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized.' });
      return;
    }

    await dbService.blockUser(req.user.id, userId);
    res.json({ message: 'User blocked successfully.' });
  } catch (error: any) {
    console.error('Block user error:', error);
    res.status(400).json({ message: error.message || 'Error blocking user.' });
  }
});

// DELETE /api/users/:userId/unblock - Unblock a user
app.delete('/api/users/:userId/unblock', protect as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized.' });
      return;
    }

    await dbService.unblockUser(req.user.id, userId);
    res.json({ message: 'User unblocked successfully.' });
  } catch (error: any) {
    console.error('Unblock user error:', error);
    res.status(400).json({ message: error.message || 'Error unblocking user.' });
  }
});

// GET /api/friends/suggestions - Get friend suggestions
app.get('/api/friends/suggestions', protect as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized.' });
      return;
    }

    const suggestions = await dbService.getFriendSuggestions(req.user.id);
    res.json({ suggestions });
  } catch (error: any) {
    console.error('Suggestions error:', error);
    res.status(500).json({ message: 'Server error retrieving friend suggestions.' });
  }
});

// GET /api/friends/status/:userId - Get friendship status with a user
app.get('/api/friends/status/:userId', protect as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized.' });
      return;
    }

    const statusObj = await dbService.getFriendRequestStatus(req.user.id, userId);
    res.json(statusObj);
  } catch (error: any) {
    console.error('Friend status error:', error);
    res.status(500).json({ message: 'Server error retrieving friendship status.' });
  }
});

// GET /api/friends/:userId - Get friend list of a user
app.get('/api/friends/:userId', protect as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const friends = await dbService.getFriendsList(userId);
    res.json({ friends });
  } catch (error: any) {
    console.error('Get friends list error:', error);
    res.status(500).json({ message: 'Server error retrieving friends list.' });
  }
});

// GET /api/friends/mutual/:userId - Get mutual friends with a given user
app.get('/api/friends/mutual/:userId', protect as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized.' });
      return;
    }

    const mutual = await dbService.getMutualFriends(req.user.id, userId);
    res.json({ mutual });
  } catch (error: any) {
    console.error('Get mutual friends error:', error);
    res.status(500).json({ message: 'Server error retrieving mutual friends.' });
  }
});

// ==========================================
// CHAT & CONVERSATIONS API ROUTES (Phase 4)
// ==========================================

// GET /api/conversations - List user's conversations
app.get('/api/conversations', protect as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized.' });
      return;
    }
    const convs = await dbService.getConversations(req.user.id);
    res.json({ conversations: convs });
  } catch (error: any) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error retrieving conversations.' });
  }
});

// GET /api/conversations/:id/messages - Paginated message history
app.get('/api/conversations/:id/messages', protect as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const skip = parseInt(req.query.skip as string) || 0;
    const limit = parseInt(req.query.limit as string) || 50;
    const messages = await dbService.getMessages(id, limit, skip);
    res.json({ messages });
  } catch (error: any) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error retrieving messages.' });
  }
});

// POST /api/conversations - Start new conversation
app.post('/api/conversations', protect as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized.' });
      return;
    }
    const { participants, isGroup, groupName } = req.body;
    // ensure current user is in participants
    if (!participants.includes(req.user.id)) {
      participants.push(req.user.id);
    }
    const conv = await dbService.startConversation(participants, isGroup, groupName);
    res.status(201).json({ conversation: conv });
  } catch (error: any) {
    console.error('Start conversation error:', error);
    res.status(500).json({ message: 'Server error starting conversation.' });
  }
});

// PUT /api/messages/:id/read - Mark message as read
app.put('/api/messages/:id/read', protect as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized.' });
      return;
    }
    const { id } = req.params;
    await dbService.markMessageRead(id, req.user.id);
    res.json({ message: 'Message marked as read' });
  } catch (error: any) {
    console.error('Mark read error:', error);
    res.status(500).json({ message: 'Server error marking message as read.' });
  }
});

// GET /api/notifications - Paginated notifications
app.get('/api/notifications', protect as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized.' });
      return;
    }
    const skip = parseInt(req.query.skip as string) || 0;
    const limit = parseInt(req.query.limit as string) || 20;
    const notifications = await dbService.getNotifications(req.user.id, limit, skip);
    res.json({ notifications });
  } catch (error: any) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Server error retrieving notifications.' });
  }
});

// PUT /api/notifications/:id/read - Mark notification as read
app.put('/api/notifications/:id/read', protect as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await dbService.markNotificationRead(id);
    res.json({ message: 'Notification marked as read' });
  } catch (error: any) {
    console.error('Mark notif read error:', error);
    res.status(500).json({ message: 'Server error marking notification as read.' });
  }
});

// PUT /api/notifications/read-all - Mark all notifications as read
app.put('/api/notifications/read-all', protect as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized.' });
      return;
    }
    await dbService.markAllNotificationsRead(req.user.id);
    res.json({ message: 'All notifications marked as read' });
  } catch (error: any) {
    console.error('Mark all notif read error:', error);
    res.status(500).json({ message: 'Server error marking all notifications as read.' });
  }
});

// ==========================================
// GROUPS API ROUTES
// ==========================================
app.post('/api/groups', protect as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const data = { ...req.body, creator: req.user.id };
    const group = await dbService.createGroup(data);
    res.status(201).json({ group });
  } catch (error: any) {
    console.error('Create group error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/groups', protect as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const groups = await dbService.getGroups();
    res.json({ groups });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/groups/:id', protect as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const group = await dbService.getGroupById(req.params.id);
    if (!group) {
      res.status(404).json({ message: 'Group not found' });
      return;
    }
    res.json({ group });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/groups/:id/join', protect as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    await dbService.requestJoinGroup(req.params.id, req.user.id);
    res.json({ message: 'Requested to join' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/groups/:id/approve/:userId', protect as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Basic permissions check could be added
    await dbService.approveJoinGroup(req.params.id, req.params.userId);
    res.json({ message: 'Approved' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/groups/:id/leave', protect as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    await dbService.leaveGroup(req.params.id, req.user.id);
    res.json({ message: 'Left group' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/groups/:id/remove/:userId', protect as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    await dbService.leaveGroup(req.params.id, req.params.userId); // remove member uses leaveGroup logic for simplicity
    res.json({ message: 'Member removed' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/groups/:id/feed', protect as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) return;
    const skip = parseInt(req.query.skip as string) || 0;
    const limit = parseInt(req.query.limit as string) || 10;
    const posts = await dbService.getGroupPosts(req.params.id, req.user.id, limit, skip);
    res.json({ posts });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/groups/:id/posts', protect as any, upload.array('media', 5), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized.' });
      return;
    }
    const { text, feeling, taggedUsers, visibility } = req.body;
    const mediaUrls: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      const files = req.files as Express.Multer.File[];
      for (const file of files) {
        try {
          const url = await uploadToCloudinary(file.buffer, file.mimetype);
          mediaUrls.push(url);
        } catch (uploadError) {
          console.error('Failed to upload file to Cloudinary:', uploadError);
        }
      }
    }
    let parsedTaggedUsers: string[] = [];
    if (taggedUsers) {
      try {
        parsedTaggedUsers = typeof taggedUsers === 'string' ? JSON.parse(taggedUsers) : taggedUsers;
      } catch (err) {
        parsedTaggedUsers = [];
      }
    }
    const newPost = await dbService.createPost({
      author: req.user.id,
      text,
      media: mediaUrls,
      feeling,
      taggedUsers: parsedTaggedUsers,
      visibility: visibility || 'public',
      postedIn: { type: 'group', refId: req.params.id }
    });
    res.status(201).json({
      message: 'Post created successfully in group!',
      post: newPost
    });
  } catch (error: any) {
    console.error('Create group post error:', error);
    res.status(500).json({ message: 'Server error creating post.' });
  }
});

// ==========================================
// PAGES API ROUTES
// ==========================================
app.post('/api/pages', protect as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const data = { ...req.body, creator: req.user.id };
    const page = await dbService.createPage(data);
    res.status(201).json({ page });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/pages', protect as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const pages = await dbService.getPages();
    res.json({ pages });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/pages/:id', protect as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const page = await dbService.getPageById(req.params.id);
    if (!page) {
      res.status(404).json({ message: 'Page not found' });
      return;
    }
    res.json({ page });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/pages/:id/follow', protect as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) return;
    await dbService.followPage(req.params.id, req.user.id);
    res.json({ message: 'Followed' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/pages/:id/unfollow', protect as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) return;
    await dbService.unfollowPage(req.params.id, req.user.id);
    res.json({ message: 'Unfollowed' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/pages/:id/feed', protect as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const skip = parseInt(req.query.skip as string) || 0;
    const limit = parseInt(req.query.limit as string) || 10;
    const posts = await dbService.getPagePosts(req.params.id, limit, skip);
    res.json({ posts });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/pages/:id/posts', protect as any, upload.array('media', 5), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized.' });
      return;
    }
    const { text, feeling, taggedUsers, visibility } = req.body;
    const mediaUrls: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      const files = req.files as Express.Multer.File[];
      for (const file of files) {
        try {
          const url = await uploadToCloudinary(file.buffer, file.mimetype);
          mediaUrls.push(url);
        } catch (uploadError) {
          console.error('Failed to upload file to Cloudinary:', uploadError);
        }
      }
    }
    let parsedTaggedUsers: string[] = [];
    if (taggedUsers) {
      try {
        parsedTaggedUsers = typeof taggedUsers === 'string' ? JSON.parse(taggedUsers) : taggedUsers;
      } catch (err) {
        parsedTaggedUsers = [];
      }
    }
    const newPost = await dbService.createPost({
      author: req.user.id,
      text,
      media: mediaUrls,
      feeling,
      taggedUsers: parsedTaggedUsers,
      visibility: visibility || 'public',
      postedIn: { type: 'page', refId: req.params.id }
    });
    res.status(201).json({
      message: 'Post created successfully in page!',
      post: newPost
    });
  } catch (error: any) {
    console.error('Create page post error:', error);
    res.status(500).json({ message: 'Server error creating post.' });
  }
});

// ==========================================
// STORIES API ROUTES
// ==========================================
app.post('/api/stories', protect as any, upload.single('media'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) return;
    if (!req.file) {
      res.status(400).json({ message: 'Media file is required.' });
      return;
    }
    const mediaUrl = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
    const mediaType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
    const story = await dbService.createStory({
      author: req.user.id,
      media: mediaUrl,
      mediaType
    });
    res.status(201).json({ story });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/stories/feed', protect as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) return;
    const feed = await dbService.getActiveStoriesFeed(req.user.id);
    res.json({ feed });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/stories/:id/view', protect as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) return;
    await dbService.markStoryViewed(req.params.id, req.user.id);
    res.json({ message: 'Story viewed' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ==========================================
// ALBUMS API ROUTES
// ==========================================
app.post('/api/albums', protect as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) return;
    const album = await dbService.createAlbum({
      owner: req.user.id,
      title: req.body.title,
      photos: []
    });
    res.status(201).json({ album });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/albums/:userId', protect as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const albums = await dbService.getUserAlbums(req.params.userId);
    res.json({ albums });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/albums/:id', protect as any, upload.array('photos', 10), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) return;
    const photoUrls = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files as Express.Multer.File[]) {
        const url = await uploadToCloudinary(file.buffer, file.mimetype);
        photoUrls.push(url);
      }
    }
    const album = await dbService.addPhotosToAlbum(req.params.id, photoUrls);
    res.json({ album });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ==========================================
// SEARCH & PRIVACY & REPORTING & ADMIN ROUTES (PHASE 7)
// ==========================================

// Search
app.get('/api/search', protect as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const q = (req.query.q || '') as string;
    const type = (req.query.type || 'all') as 'users'|'posts'|'groups'|'pages'|'all';
    const results = await dbService.searchUnified(q, type, req.user?.id);
    res.json({ results });
  } catch (error: any) {
    console.error('Unified search error:', error);
    res.status(500).json({ message: 'Server error performing search.' });
  }
});

// Privacy Settings Updates
app.put('/api/users/privacy', protect as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized.' });
      return;
    }
    const { defaultPostVisibility, friendRequestSender, friendsListVisibility } = req.body;
    const updatedUser = await dbService.updatePrivacySettings(req.user.id, {
      defaultPostVisibility,
      friendRequestSender,
      friendsListVisibility
    });
    res.json({ message: 'Privacy settings updated successfully.', user: updatedUser });
  } catch (error: any) {
    console.error('Update privacy settings error:', error);
    res.status(500).json({ message: 'Server error updating privacy settings.' });
  }
});

// Reporting system
app.post('/api/reports', protect as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized.' });
      return;
    }
    const { targetType, targetId, reason } = req.body;
    if (!targetType || !targetId || !reason) {
      res.status(400).json({ message: 'Target type, target ID, and reason are required.' });
      return;
    }
    const report = await dbService.createReport({
      reporter: req.user.id,
      targetType,
      targetId,
      reason
    });
    res.status(201).json({ message: 'Report submitted successfully.', report });
  } catch (error: any) {
    console.error('Submit report error:', error);
    res.status(500).json({ message: 'Server error submitting report.' });
  }
});

// Admin verification middleware
async function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized.' });
      return;
    }
    const user = await dbService.findUserById(req.user.id);
    if (!user || !user.isAdmin) {
      res.status(403).json({ message: 'Access denied. Admin privileges required.' });
      return;
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error checking admin authorization.' });
  }
}

// Admin stats
app.get('/api/admin/stats', protect as any, requireAdmin as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const stats = await dbService.getAdminStats();
    res.json({ stats });
  } catch (error: any) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ message: 'Server error getting admin stats.' });
  }
});

// Admin users list
app.get('/api/admin/users', protect as any, requireAdmin as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const query = (req.query.q || '') as string;
    const users = await dbService.getAdminUsers(query);
    res.json({ users });
  } catch (error: any) {
    console.error('Get admin users error:', error);
    res.status(500).json({ message: 'Server error getting user list.' });
  }
});

// Admin suspend / unsuspend user
app.put('/api/admin/users/:userId/suspend', protect as any, requireAdmin as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { suspended } = req.body; // boolean
    const updatedUser = await dbService.suspendUser(userId, suspended);
    res.json({ message: suspended ? 'User suspended successfully.' : 'User unsuspended successfully.', user: updatedUser });
  } catch (error: any) {
    console.error('Suspend user error:', error);
    res.status(500).json({ message: 'Server error updating user suspension.' });
  }
});

// Admin delete user
app.delete('/api/admin/users/:userId', protect as any, requireAdmin as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    await dbService.deleteUser(userId);
    res.json({ message: 'User deleted successfully.' });
  } catch (error: any) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error deleting user.' });
  }
});

// Admin list reports
app.get('/api/admin/reports', protect as any, requireAdmin as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const reports = await dbService.getReports();
    res.json({ reports });
  } catch (error: any) {
    console.error('Get admin reports error:', error);
    res.status(500).json({ message: 'Server error getting reports.' });
  }
});

// Admin take action / update report status
app.put('/api/admin/reports/:reportId/status', protect as any, requireAdmin as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { reportId } = req.params;
    const { status } = req.body; // 'pending' or 'reviewed'
    const updatedReport = await dbService.updateReportStatus(reportId, status);
    res.json({ message: 'Report status updated successfully.', report: updatedReport });
  } catch (error: any) {
    console.error('Update report status error:', error);
    res.status(500).json({ message: 'Server error updating report status.' });
  }
});

// ==========================================
// VITE INTEGRATION & STATIC SERVING & SOCKET.IO
// ==========================================
async function startServer() {
  const httpServer = createHttpServer(app);
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Track online users: Map<userId, socketId>
  const onlineUsers = new Map<string, string>();

  io.on('connection', (socket) => {
    // 1. User connects and authenticates
    socket.on('join', (userId: string) => {
      onlineUsers.set(userId, socket.id);
      socket.join(userId); // Join personal room for targeted notifications
      io.emit('userOnline', userId);
    });

    // 2. Chat messages
    socket.on('sendMessage', async (data: { conversationId: string, senderId: string, text?: string, media?: string, participants: string[] }) => {
      try {
        const msg = await dbService.sendMessage(data.conversationId, data.senderId, data.text, data.media);
        
        // Emit to all participants
        data.participants.forEach(participantId => {
          io.to(participantId).emit('newMessage', msg);
        });
      } catch (err) {
        console.error('Socket send message error:', err);
      }
    });

    // 3. Typing indicators
    socket.on('typing', (data: { conversationId: string, senderId: string, participants: string[] }) => {
      data.participants.forEach(participantId => {
        if (participantId !== data.senderId) {
          io.to(participantId).emit('typing', { conversationId: data.conversationId, senderId: data.senderId });
        }
      });
    });

    socket.on('stopTyping', (data: { conversationId: string, senderId: string, participants: string[] }) => {
      data.participants.forEach(participantId => {
        if (participantId !== data.senderId) {
          io.to(participantId).emit('stopTyping', { conversationId: data.conversationId, senderId: data.senderId });
        }
      });
    });

    // 4. Notifications
    socket.on('sendNotification', async (data: { recipientId: string, senderId: string, type: string, relatedPost?: string, relatedComment?: string }) => {
      try {
        const notif = await dbService.createNotification(data.recipientId, data.senderId, data.type, data.relatedPost, data.relatedComment);
        if (notif) {
          io.to(data.recipientId).emit('newNotification', notif);
        }
      } catch (err) {
        console.error('Socket notification error:', err);
      }
    });

    // 5. Check if user is online
    socket.on('checkOnlineStatus', (userId: string, callback: (isOnline: boolean) => void) => {
      callback(onlineUsers.has(userId));
    });

    socket.on('disconnect', () => {
      let disconnectedUserId = null;
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          disconnectedUserId = userId;
          onlineUsers.delete(userId);
          break;
        }
      }
      if (disconnectedUserId) {
        io.emit('userOffline', disconnectedUserId);
      }
    });
  });

  // Make io available to express routes if needed
  app.set('io', io);

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

startServer();
